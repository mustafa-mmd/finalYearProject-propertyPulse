import connectDB from "@/config/database";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { getHighResProfileImage } from "@/utils/avatar";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError("Authentication required", { status: 401, code: "AUTH_REQUIRED" });

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("_id name email image roles verification preferences createdAt")
      .lean();
    if (!user) return apiError("User not found", { status: 404 });

    // If user has no image in DB but session has one (from OAuth token), save it
    if (!user.image && session.user.image) {
      const hiResImage = getHighResProfileImage(session.user.image) || session.user.image;
      await User.updateOne({ _id: user._id }, { $set: { image: hiResImage } });
      user.image = hiResImage;
    }

    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error, "user.profile.get");
  }
}

export async function PUT(request) {
  const { requireActor } = await import("@/utils/authorization");
  const { writeAuditLog } = await import("@/utils/audit");
  const { cleanText } = await import("@/utils/propertyValidation");
  const cloudinary = (await import("@/config/cloudinery")).default;

  try {
    const actor = await requireActor();
    const contentType = request.headers.get("content-type") || "";

    let name;
    let imageUrl;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = cleanText(formData.get("name"), 100);
      const imageFile = formData.get("image");

      if (imageFile && typeof imageFile.arrayBuffer === "function" && imageFile.size > 0) {
        if (imageFile.size > 5 * 1024 * 1024) {
          return apiError("Image size must be less than 5MB", { status: 422, code: "FILE_TOO_LARGE" });
        }
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const dataUrl = `data:${imageFile.type || "image/png"};base64,${buffer.toString("base64")}`;

        try {
          if (process.env.CLOUDINERY_CLOUD_NAME && process.env.CLOUDINERY_API_KEY) {
            const uploadResult = await cloudinary.uploader.upload(dataUrl, {
              folder: "PropertyPulse/avatars",
              resource_type: "image",
              transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }],
            });
            imageUrl = uploadResult.secure_url;
          } else {
            imageUrl = dataUrl;
          }
        } catch (cloudErr) {
          console.warn("[profile.update] Cloudinary upload failed, using data URL:", cloudErr?.message);
          imageUrl = dataUrl;
        }
      } else if (typeof formData.get("imageUrl") === "string") {
        imageUrl = cleanText(formData.get("imageUrl"), 2000);
      }
    } else {
      const body = await request.json().catch(() => ({}));
      if (body.name) name = cleanText(body.name, 100);
      if (body.imageUrl !== undefined) imageUrl = cleanText(body.imageUrl, 2000);
      if (body.image !== undefined) imageUrl = cleanText(body.image, 2000);
    }

    await connectDB();
    const user = await User.findById(actor.id);
    if (!user) return apiError("User not found", { status: 404 });

    if (name && name.length >= 2) user.name = name;
    if (imageUrl !== undefined) user.image = imageUrl;

    await user.save();
    await writeAuditLog({ actor, action: "user.profile_updated", targetType: "User", targetId: user._id, request });

    return apiSuccess({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    return handleApiError(error, "user.profile.update");
  }
}

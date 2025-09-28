// import connectDB from "@/config/database";
// import Property from "@/models/Property";
// import User from "@/models/User";
// import { getSessionUser } from "@/utils/getSessionUser";
// import cloudinary from "@/config/cloudinery";

// export const GET = async (request) => {
//   try {
//     await connectDB();

//     const page = parseInt(request.nextUrl.searchParams.get("page")) || 1;
//     const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize")) || 6;
//     const skip = (page - 1) * pageSize;

//     const total = await Property.countDocuments({});
//     const properties = await Property.find({}).skip(skip).limit(pageSize);

//     return new Response(JSON.stringify({ total, properties }), { status: 200 });
//   } catch (err) {
//     console.error("Error fetching properties:", err);
//     return new Response("Something went wrong", { status: 500 });
//   }
// };

// // -------------------- POST /api/prop --------------------
// export const POST = async (request) => {
//   try {
//     await connectDB();

//     // ✅ Get session user
//     const sessionUser = await getSessionUser();
//     if (!sessionUser || !sessionUser.userId) {
//       return new Response(
//         JSON.stringify({
//           message: "Authentication required. Please sign in again.",
//           code: "AUTH_REQUIRED",
//         }),
//         { status: 401, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     const formData = await request.formData();

//     // ✅ Find user in DB
//     const dbUser = await User.findOne({ email: sessionUser.user.email });
//     if (!dbUser) {
//       return new Response(
//         JSON.stringify({ message: "User not found in database" }),
//         { status: 404 }
//       );
//     }

//     const ownerId = dbUser._id;

//     // ✅ Fix field names
//     const amenities = formData.getAll("amenities[]");
//     const images = formData.getAll("images").filter((image) => image.name !== "");

//     const propertyData = {
//       type: formData.get("type"),
//       name: formData.get("name"),
//       description: formData.get("description"),
//       location: {
//         street: formData.get("location[street]"),
//         city: formData.get("location[city]"),
//         state: formData.get("location[state]"),
//         zipcode: formData.get("location[zipcode]"),
//       },
//       beds: formData.get("beds"),
//       baths: formData.get("baths"),
//       square_feet: formData.get("square_feet"),
//       amenities,
//       rates: {
//         weekly: formData.get("rates[weekly]"),
//         monthly: formData.get("rates[monthly]"),
//         nightly: formData.get("rates[nightly]"),
//       },
//       seller_info: {
//         name: formData.get("seller_info[name]"),
//         email: formData.get("seller_info[email]"),
//         phone: formData.get("seller_info[phone]"),
//       },
//       owner: ownerId,
//     };

//     // ✅ Upload images to Cloudinary
//     const imageUploadPromises = images.map(async (image) => {
//       const imageBuffer = await image.arrayBuffer();
//       const imageArray = Array.from(new Uint8Array(imageBuffer));
//       const imageData = Buffer.from(imageArray);
//       const imageBase64 = imageData.toString("base64");

//       const mimeType = image.type || "image/jpeg";
//       const result = await cloudinary.uploader.upload(
//         `data:${mimeType};base64,${imageBase64}`,
//         { folder: "PropertyPulse" }
//       );
//       return result.secure_url;
//     });

//     const uploadedImages = await Promise.all(imageUploadPromises);
//     propertyData.images = uploadedImages;

//     // ✅ Save property
//     const newProperty = new Property(propertyData);
//     await newProperty.save();

//     // ✅ Redirect after success
//     return Response.redirect(new URL("/properties", request.url), 302);
//   } catch (err) {
//     console.error("Error adding property:", err);
//     return new Response(
//       JSON.stringify({ message: "Failed to add property", error: err.message }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// };





import connectDB from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { getSessionUser } from "@/utils/getSessionUser";
import cloudinary from "@/config/cloudinery";

export const GET = async (request) => {
  try {
    await connectDB();

    const page = parseInt(request.nextUrl.searchParams.get("page")) || 1;
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize")) || 6;
    const skip = (page - 1) * pageSize;

    const total = await Property.countDocuments({});
    const properties = await Property.find({}).skip(skip).limit(pageSize);

    return new Response(JSON.stringify({ total, properties }), { status: 200 });
  } catch (err) {
    console.error("Error fetching properties:", err);
    return new Response("Something went wrong", { status: 500 });
  }
};

export const POST = async (request) => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response(
        JSON.stringify({
          message: "Authentication required. Please sign in again.",
          code: "AUTH_REQUIRED",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const formData = await request.formData();

    const dbUser = await User.findOne({ email: sessionUser.user.email });
    if (!dbUser) {
      return new Response(
        JSON.stringify({ message: "User not found in database" }),
        { status: 404 }
      );
    }

    const ownerId = dbUser._id;

    const amenities = formData.getAll("amenities[]");
    const images = formData.getAll("images").filter((image) => image.name !== "");

    const propertyData = {
      type: formData.get("type"),
      name: formData.get("name"),
      description: formData.get("description"),
      location: {
        street: formData.get("location[street]"),
        city: formData.get("location[city]"),
        state: formData.get("location[state]"),
        zipcode: formData.get("location[zipcode]"),
      },
      beds: formData.get("beds"),
      baths: formData.get("baths"),
      square_feet: formData.get("square_feet"),
      amenities,
      rates: {
        weekly: formData.get("rates[weekly]"),
        monthly: formData.get("rates[monthly]"),
        nightly: formData.get("rates[nightly]"),
      },
      seller_info: {
        name: formData.get("seller_info[name]"),
        email: formData.get("seller_info[email]"),
        phone: formData.get("seller_info[phone]"),
      },
      owner: ownerId,
    };

    const imageUploadPromises = images.map(async (image) => {
      const imageBuffer = await image.arrayBuffer();
      const imageArray = Array.from(new Uint8Array(imageBuffer));
      const imageData = Buffer.from(imageArray);
      const imageBase64 = imageData.toString("base64");

      const mimeType = image.type || "image/jpeg";
      const result = await cloudinary.uploader.upload(
        `data:${mimeType};base64,${imageBase64}`,
        { folder: "PropertyPulse" }
      );
      return result.secure_url;
    });

    const uploadedImages = await Promise.all(imageUploadPromises);
    propertyData.images = uploadedImages;

    const newProperty = new Property(propertyData);
    await newProperty.save();

    // ✅ Return JSON success response instead of redirect
    return new Response(
      JSON.stringify({ 
        message: "Property added successfully",
        success: true 
      }), 
      { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      }
    );

  } catch (err) {
    console.error("Error adding property:", err);
    return new Response(
      JSON.stringify({ message: "Failed to add property", error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
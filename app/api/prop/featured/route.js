import connectDB from "@/config/database";
import Property from "@/models/Property";
import { listingPublicFilter } from "@/config/listings";
import { handleApiError } from "@/utils/apiResponse";

export async function GET() {
  try {
    await connectDB();
    const properties = await Property.find({
      $and: [listingPublicFilter(), { is_featured: true }],
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(12)
      .lean();
    return Response.json(properties, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    return handleApiError(error, "properties.featured");
  }
}

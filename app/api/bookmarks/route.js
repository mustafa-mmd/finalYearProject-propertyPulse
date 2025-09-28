import connectDB from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";
import { getSessionUser } from "@/utils/getSessionUser";

export const dynamic = "force-dynamic";

// GET /api/bookmarks
export async function GET(request) {
  try {
    console.log(" GET /api/bookmarks - Starting request...");
    await connectDB();

    const sessionUser = await getSessionUser();
    console.log(" Session User ID:", sessionUser?.userId);
    
    if (!sessionUser || !sessionUser.userId) {
      console.log(" User not authenticated");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    // Handle bookmark check for a specific property
    if (propertyId) {
      console.log(" Checking bookmark status for property:", propertyId);
      const user = await User.findById(sessionUser.userId);
      const isBookmarked = user?.bookmarks?.includes(propertyId) || false;
      return new Response(JSON.stringify({ isBookmarked }), { status: 200 });
    }

    // Handle fetching all bookmarked properties
    console.log(" Fetching all bookmarks for user:", sessionUser.userId);
    const user = await User.findById(sessionUser.userId);
    const bookmarks = user?.bookmarks || [];

    console.log(" Bookmark IDs found:", bookmarks);
    console.log(" Number of bookmarks:", bookmarks.length);

    if (bookmarks.length === 0) {
      console.log(" No bookmarks found for user");
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // Fetch the actual property documents
    console.log(" Searching for properties with IDs:", bookmarks);
    const properties = await Property.find({ 
      _id: { $in: bookmarks } 
    }).lean();

    console.log(" Properties fetched from database:", properties.length);
    
    if (properties.length === 0) {
      console.log(" No properties found for the bookmark IDs");
    } else {
      console.log(" Property IDs found:", properties.map(p => p._id));
    }
    
    // Ensure we always return an array
    const result = Array.isArray(properties) ? properties : [properties];
    console.log(" Final data being sent:", result.length, "properties");
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error(" Error in GET /api/bookmarks:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// POST /api/bookmarks - Toggle bookmark
export async function POST(request) {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();
    
    if (!sessionUser || !sessionUser.userId) {
      return new Response(JSON.stringify({ message: "User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return new Response(JSON.stringify({ message: "Property ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify the property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      console.log(" Property not found:", propertyId);
      return new Response(JSON.stringify({ message: "Property not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = await User.findById(sessionUser.userId);
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    let isBookmarked = user.bookmarks.includes(propertyId);
    let message;

    if (isBookmarked) {
      user.bookmarks.pull(propertyId);
      message = "Bookmark removed successfully";
      isBookmarked = false;
    } else {
      user.bookmarks.push(propertyId);
      message = "Bookmark added successfully";
      isBookmarked = true;
    }

    await user.save();

    console.log(" Bookmark updated - User:", sessionUser.userId, 
                "Property:", propertyId, "New status:", isBookmarked);

    return new Response(JSON.stringify({ message, isBookmarked }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error(" Error in POST /api/bookmarks:", error);
    return new Response(JSON.stringify({ message: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
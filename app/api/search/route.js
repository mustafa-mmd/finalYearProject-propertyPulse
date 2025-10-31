import connectDB from "@/config/database";
import Property from "@/models/property";

export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    let location = decodeURIComponent(searchParams.get("location") || "").trim();
    const propertyType = decodeURIComponent(searchParams.get("propertyType") || "All").trim();

    console.log("📍 Received search request:", { location, propertyType });

    const andConditions = [];

    // ✅ Location filter with more flexible matching
    if (location) {
      // Split location into individual words for better matching
      const locationWords = location.split(/\s+/).filter(word => word.length > 0);
      
      const locationConditions = [];
      
      // Create search patterns for each word
      locationWords.forEach(word => {
        // Escape special regex characters
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordPattern = new RegExp(escapedWord, "i");
        
        locationConditions.push(
          { name: wordPattern },
          { description: wordPattern },
          { "location.street": wordPattern },
          { "location.city": wordPattern },
          { "location.state": wordPattern },
          { "location.zipcode": wordPattern }
        );
      });

      // Use $or for individual words and $and to require all words match somewhere
      if (locationWords.length > 1) {
        andConditions.push({
          $and: locationWords.map(word => {
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordPattern = new RegExp(escapedWord, "i");
            return {
              $or: [
                { name: wordPattern },
                { description: wordPattern },
                { "location.street": wordPattern },
                { "location.city": wordPattern },
                { "location.state": wordPattern },
                { "location.zipcode": wordPattern }
              ]
            };
          })
        });
      } else if (locationWords.length === 1) {
        andConditions.push({ $or: locationConditions });
      }
    }

    // ✅ Property type filter
    if (propertyType && propertyType !== "All") {
      andConditions.push({ type: new RegExp(`^${propertyType}$`, "i") });
    }

    // ✅ Final query
    const query = andConditions.length > 0 ? { $and: andConditions } : {};

    console.log("🔎 Database query:", JSON.stringify(query, null, 2));

    const properties = await Property.find(query).lean();
    console.log("✅ Found properties:", properties.length);

    // If no results with strict matching, try fuzzy search
    if (properties.length === 0 && location) {
      console.log("🔄 Trying fuzzy search...");
      const fuzzyQuery = {
        $or: [
          { name: new RegExp(location.split(' ')[0], "i") }, // First word only
          { "location.city": new RegExp(location.split(' ')[0], "i") }
        ]
      };
      
      if (propertyType && propertyType !== "All") {
        fuzzyQuery.type = new RegExp(`^${propertyType}$`, "i");
      }
      
      const fuzzyProperties = await Property.find(fuzzyQuery).lean();
      console.log("🔍 Fuzzy search found:", fuzzyProperties.length, "properties");
      return new Response(JSON.stringify(fuzzyProperties), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(properties), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error in search route:", err);
    return new Response(
      JSON.stringify({ message: "Something went wrong", error: err.message }),
      { status: 500 }
    );
  }
};
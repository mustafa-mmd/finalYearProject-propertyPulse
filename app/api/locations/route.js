//creating after deplying the app new rout file 
import connectDB from "@/config/database";
import Property from "@/models/property";

export const GET = async (request) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const queryLower = query.toLowerCase().trim();

    // Get all unique cities from properties
    const cities = await Property.distinct("location.city");
    
    // Get all unique states
    const states = await Property.distinct("location.state");
    
    // Combine and deduplicate
    let allLocations = [...new Set([...cities, ...states])]
      .filter(loc => loc && loc.trim() !== "")
      .map(loc => loc.trim())
      .sort();

    // Filter by query if provided
    if (queryLower) {
      allLocations = allLocations.filter(loc => 
        loc.toLowerCase().includes(queryLower) ||
        queryLower.includes(loc.toLowerCase())
      );
      
      // Prioritize exact matches and start-with matches
      allLocations.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
        if (!aLower.startsWith(queryLower) && bLower.startsWith(queryLower)) return 1;
        if (aLower === queryLower && bLower !== queryLower) return -1;
        if (aLower !== queryLower && bLower === queryLower) return 1;
        return a.localeCompare(b);
      });
    }

    return new Response(JSON.stringify(allLocations), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
      },
    });
  } catch (err) {
    console.error("❌ Error fetching locations:", err);
    return new Response(
      JSON.stringify({ message: "Failed to fetch locations" }),
      { status: 500 }
    );
  }
};
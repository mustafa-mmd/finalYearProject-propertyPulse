import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import connectDB from "@/config/database";
import User from "@/models/User";

export const GET = async () => {
  try {
    console.log("=== DEBUG ENDPOINT ===");
    
    // Check session
    const session = await getServerSession(authOptions);
    console.log("Session:", session);
    
    // Check database connection
    try {
      await connectDB();
      console.log("✅ Database connected");
      
      // Check if user exists in DB
      if (session?.user?.email) {
        const user = await User.findOne({ email: session.user.email });
        console.log("User in DB:", user);
        
        // Count all users
        const userCount = await User.countDocuments();
        console.log("Total users in DB:", userCount);
      }
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
    }
    
    return new Response(
      JSON.stringify({ 
        session, 
        message: "Check server console for debug info" 
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Debug error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
};
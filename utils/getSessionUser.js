// import { getServerSession } from "next-auth";
// import { authOptions } from "@/utils/authOptions";

// // Works in Next.js App Router (route handlers)
// export const getSessionUser = async () => {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session || !session.user) {
//       return null;
//     }

//     return {
//       user: session.user,
//       userId: session.user.id, // this will be set in authOptions.session callback
//     };
//   } catch (err) {
//     console.error("❌ Error in getSessionUser:", err);
//     return null;
//   }
// };




import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";

export const getSessionUser = async () => {
  try {
    console.log("Getting server session...");
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log("No session or user found");
      return null;
    }

    // Check if user ID exists in session
    if (session.user.id) {
      console.log("✅ Session user with ID:", session.user.id);
      return {
        user: session.user,
        userId: session.user.id,
      };
    }

    console.error("❌ User ID not found in session");
    return null;
    
  } catch (err) {
    console.error("❌ Error in getSessionUser:", err);
    return null;
  }
};
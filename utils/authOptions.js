// import GoogleProvider from "next-auth/providers/google";
// import connectDB from "@/config/database";
// import User from "@/models/User";

// export const authOptions = {
//   providers: [
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       authorization: {
//         params: {
//           prompt: "consent",
//           access_type: "offline",
//           response_type: "code",
//         },
//       },
//     }),
//   ],

//   callbacks: {
//     async signIn({ profile }) {
//       console.log("Google profile:", profile); //  Log what Google returns

//       if (!profile) {
//         console.error("No profile returned from Google");
//         return false; // Block login only if profile is missing
//       }

//       try {
//         await connectDB();

//         const existingUser = await User.findOne({ email: profile.email });

//         if (!existingUser) {
//           const username = profile.name
//             ? profile.name.slice(0, 20)
//             : profile.email.split("@")[0]; // fallback if name is missing

//           await User.create({
//             username,
//             email: profile.email,
//             image: profile.picture,
//           });
//         }

//         return true;
//       } catch (error) {
//         console.error("Error in signIn callback:", error);
//         return true; //  allow login even if DB fails (prevents AccessDenied)
//       }
//     },

//     async session({ session }) {
//       try {
//         await connectDB();

//         const user = await User.findOne({ email: session.user.email });
//         if (user) {
//           session.user.id = user._id.toString();
//         }

//         return session;
//       } catch (error) {
//         console.error("Error in session callback:", error);
//         return session; //  fallback session without DB
//       }
//     },
//   },
// };





import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/config/database";
import User from "@/models/User";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      console.log("=== SIGNIN CALLBACK ===");
      console.log("Google profile:", profile);

      if (!profile) {
        console.error("No profile returned from Google");
        return false;
      }

      try {
        console.log("Attempting to connect to DB...");
        await connectDB();
        console.log("✅ Database connected in signIn callback");

        // Check if user exists
        console.log("Looking for user with email:", profile.email);
        let user = await User.findOne({ email: profile.email });
        console.log("User found in DB:", user ? user._id : "None");

        if (!user) {
          console.log("Creating new user...");
          user = await User.create({
            name: profile.name || profile.email.split("@")[0],
            email: profile.email,
            image: profile.picture,
          });
          console.log("✅ New user created:", user._id.toString());
        } else {
          console.log("✅ Existing user found:", user._id.toString());
        }

        return true;

      } catch (error) {
        console.error("❌ Error in signIn callback:", error);
        console.error("Error details:", error.message);
        return true; // Allow signin even if DB fails
      }
    },

    async jwt({ token, user }) {
      console.log("=== JWT CALLBACK ===");
      console.log("Token:", token);
      console.log("User:", user);
      
      // If user just signed in, add their ID to the token
      if (user) {
        token.id = user.id;
        console.log("✅ Added user ID to token:", user.id);
      }
      return token;
    },

    // ADD THIS UPDATED SESSION CALLBACK:
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Initial session:", session);
      console.log("Token:", token);
      
      try {
        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        
        if (user) {
          session.user.id = user._id.toString(); // Use database ID, not Google ID
          console.log("✅ User ID from DB:", user._id.toString());
        } else {
          console.error("❌ User not found in database");
        }

        console.log("Final session:", session);
        return session;
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },
  },

  session: {
    strategy: "jwt",
  },

  debug: true,
};





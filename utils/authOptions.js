// import GoogleProvider from 'next-auth/providers/google';
// import connectDB from '@/config/database';
// import User from '@/models/User';
// export const authOptions = {
//   providers: [  
//     GoogleProvider({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       authorization: {
//         params: {
//           prompt: 'consent',
//           access_type: 'offline',
//           response_type: 'code',
          
//         }  
//       },

//     }),
//   ],
//   callbacks:{
//     //invoked after a user signs in
//     async signIn({profile}){
// // 1.connect to database
// await connectDB();

// // //2.check if user exists in db
// const existingUser = await User.findOne({email: profile.email});
// // //3.if not then add user to db
// if(!existingUser){
//   //truncate if user name to long
//   const username=profile.name.slice(0, 20);
//   await User.create({
//     username,
//     email: profile.email,
//     image: profile.picture,
//   });
// }
// // //4.return true to allow sign in
// return true;
//     },
//     //modify session object
//     async session({session}) {
//       //1.get user from db
//       const user = await User.findOne({email: session.user.email});
//       //2.assign user id to session object
//       session.user.id = user._id.toString();
//       //3.return session object
//       return session;
//     }
//    }
  
//  }




import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/config/database';
import User from '@/models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      try {
        if (!profile) return false;

        await connectDB();

        const existingUser = await User.findOne({ email: profile.email });

        if (!existingUser) {
          const username = profile.name.slice(0, 20);
          await User.create({
            username,
            email: profile.email,
            image: profile.picture,
          });
        }
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },

    async session({ session }) {
      try {
        const user = await User.findOne({ email: session.user.email });
        session.user.id = user?._id?.toString();
        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        return session;
      }
    },
  },
};

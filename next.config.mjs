// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images:{
//     remotePatterns:[
//       {
//         protocol:'https',
//         hostname:'lh3.googleusercontent.com',
//         pathname:'**',
//       },
//       {
//         protocol:'https',
//         hostname:'res.cloudinary.com',
//         pathname:'**',
//       },
//     ],
//   },
// };

// export default nextConfig;




//oper wala sahee hay bina diable console wala hay

import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
    ],
  },

  webpack: (config) => {
    const disablePath = path.resolve("./utils/disableConsole.js");

    //  original entry ko save karo
    const originalEntry = config.entry;

    config.entry = async () => {
      const entries =
        typeof originalEntry === "function"
          ? await originalEntry()
          : originalEntry;

      if (
        entries["main-app"] &&
        !entries["main-app"].includes(disablePath)
      ) {
        entries["main-app"].unshift(disablePath);
      }

      return entries;
    };

    return config;
  },
};

export default nextConfig;



// // for production just disable console log and debug
// import path from "path";

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "lh3.googleusercontent.com",
//         pathname: "**",
//       },
//       {
//         protocol: "https",
//         hostname: "res.cloudinary.com",
//         pathname: "**",
//       },
//     ],
//   },

//   webpack: (config) => {
//     const disablePath = path.resolve("./utils/disableConsole.js");

//     // Save original entry
//     const originalEntry = config.entry;

//     config.entry = async () => {
//       const entries =
//         typeof originalEntry === "function"
//           ? await originalEntry()
//           : originalEntry;

//       // ✅ Only apply in production
//       if (process.env.NODE_ENV === "production") {
//         if (
//           entries["main-app"] &&
//           !entries["main-app"].includes(disablePath)
//         ) {
//           entries["main-app"].unshift(disablePath);
//         }
//       }

//       return entries;
//     };

//     return config;
//   },
// };

// export default nextConfig;

// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
// import { ToastContainer} from 'react-toastify';
// import "../styles/global.css";
// import "react-toastify/dist/ReactToastify.css"
// import { GlobalProvider } from "@/context/globalContext";
// import 'photoswipe/dist/photoswipe.css'
// import "@/utils/disableConsole";
// export const metadata = {
//   title: "Next.js Property App",
//   description: "A property listing application built with Next.js",
//   keywords: "Next.js, Property, Real Estate",
// };

// import AuthProvider from "@/components/AuthProvider";

// export default function RootLayout({ children, session }) {
//   return (
//     <html lang="en">
//       <body>
//         <GlobalProvider>
//         <AuthProvider session={session}>
//           <Navbar />
//           <main>{children}</main>
//           <Footer />
//           <ToastContainer/>
//         </AuthProvider>
//       </GlobalProvider>
//       </body>
//     </html>
//   );
// }


//after deployment
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ToastContainer } from 'react-toastify';
import "../styles/global.css";
import "react-toastify/dist/ReactToastify.css"
import { GlobalProvider } from "@/context/globalContext";
import 'photoswipe/dist/photoswipe.css'
import "@/utils/disableConsole";
import AuthProvider from "@/components/AuthProvider";

// Updated metadata with property/home related info
export const metadata = {
  title: "PropertyPulse | Find Your Dream Home",
  description: "Discover amazing properties for sale and rent. Find apartments, houses, villas, and commercial spaces.",
  keywords: "real estate, property, homes for sale, apartments for rent, buy property, rent property, real estate listings",
  authors: [{ name: "PropertyPulse" }],
  openGraph: {
    title: "PropertyPulse | Find Your Dream Home",
    description: "Discover amazing properties for sale and rent",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PropertyPulse | Find Your Dream Home",
    description: "Discover amazing properties for sale and rent",
  }
};

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <head>
        {/* Simple emoji favicon that works immediately - Blue house icon */}
        <link 
          rel="icon" 
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%233b82f6%22>🏠</text></svg>" 
        />
        
        {/* For Apple devices */}
        <link 
          rel="apple-touch-icon" 
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%233b82f6%22>🏠</text></svg>" 
        />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#3b82f6" />
        
        {/* Essential meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
      </head>
      <body>
        <GlobalProvider>
          <AuthProvider session={session}>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <ToastContainer />
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}

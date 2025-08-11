import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/global.css";
export const metadata = {
  title: "Next.js Property App",
  description: "A property listing application built with Next.js",
  keywords: "Next.js, Property, Real Estate",
};
// import AuthProvider from "@/components/AuthProvider";
// export default function RootLayout({ children }) {
//   return (
//     <AuthProvider>
//     <html lang="en">
//       <body>
//         <Navbar />
//        <main> {children}</main>
//        <Footer/>
//       </body>
//     </html>
//     </AuthProvider>
//   );
// }


import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider session={session}>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}



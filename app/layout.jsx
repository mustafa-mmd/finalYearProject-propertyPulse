import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ToastContainer} from 'react-toastify';
import "../styles/global.css";
import "react-toastify/dist/ReactToastify.css"
import { GlobalProvider } from "@/context/globalContext";
import 'photoswipe/dist/photoswipe.css'
// import "@/utils/disableConsole";
export const metadata = {
  title: "Next.js Property App",
  description: "A property listing application built with Next.js",
  keywords: "Next.js, Property, Real Estate",
};

import AuthProvider from "@/components/AuthProvider";

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <body>
        <GlobalProvider>
        <AuthProvider session={session}>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ToastContainer/>
        </AuthProvider>
      </GlobalProvider>
      </body>
    </html>
  );
}



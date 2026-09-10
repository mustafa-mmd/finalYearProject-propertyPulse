export { default as proxy } from "next-auth/middleware";

export const config = {
  matcher: [
    "/properties/add",
    "/profile",
    "/properties/saved",
    "/messages/:path*",
    "/admin/:path*",
    "/organizations/:path*",
    "/viewings/:path*",
    "/bookings/:path*",
    "/rental-applications/:path*",
    "/maintenance/:path*",
    "/offers/:path*",
    "/notifications/:path*",
    "/support/:path*",
    "/leases/:path*",
    "/invoices/:path*",
    "/tenant/:path*",
    "/owner/:path*",
    "/sales/:path*",
    "/settings/:path*",
  ],
};

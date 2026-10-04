# PropertyPulse 🏢

PropertyPulse is a production-ready, industry-level PropTech marketplace and SaaS operations platform. Built with Next.js App Router and MongoDB, it serves as a comprehensive ecosystem for short-term stays, long-term rentals, property sales, and multi-tenant property management.

## 🌟 Key Features

### For Tenants & Buyers (Customer Portal)
- **Advanced Discovery**: Filter by location, amenities, pricing, and purpose (Sale, Rent, Short-term).
- **Bookings & Stays**: Request short-term stays, process payments, and track booking statuses.
- **Rental Applications**: Submit long-term rental applications, upload documents, and track approval pipelines.
- **Purchase Offers**: Make legally sound purchase offers and earnest deposits with counter-offer negotiations.
- **Lease Agreements**: View and digitally sign jurisdiction-compliant lease agreements.
- **Maintenance Hub**: Report maintenance issues with priority levels and track resolution progress.
- **Financials**: View rent statements, invoices, and process secure payments.

### For Landlords & Property Managers (Owner Dashboard)
- **Listing Management**: Publish, edit, and unpublish properties with robust media uploads.
- **Workflow Automation**: One-click accept/decline workflows for applications and bookings.
- **Organization Workspaces**: B2B multi-tenant organization support with role-based access control (RBAC).
- **Tenant Management**: Track active leases, upcoming renewals, and tenant profiles.
- **Financial Tracking**: Monitor generated invoices, collected payments, and upcoming dues.

### For Platform Administrators (Super Admin Operations)
- **Live Control Center**: Monitor system health, live platform data, and operational errors.
- **Compliance & Safety**: Handle fraud cases, risk rules, and high-risk verification requests.
- **User & Org Management**: Moderate users, listings, and active organizations.
- **Fine-grained RBAC**: Admin access is strictly filtered by assigned roles (e.g., `properties.review`, `users.read`).

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) (Transactional domain records, optimized with `.lean()`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Mobile-first, responsive, rich modern UI)
- **Authentication**: NextAuth.js (OAuth, session management, secure JWT handling)
- **Media**: Cloudinary integration for scalable image hosting
- **Icons**: React Icons (FontAwesome suite)

## 📂 Architecture & Project Structure

- **`app/`**: Route definitions using Next.js App Router.
  - `/admin`: Super admin operational dashboards.
  - `/bookings`, `/rental-applications`, `/offers`, `/leases`: Core transaction workflows.
  - `/api`: REST endpoints for client-side fetches and webhooks.
- **`components/`**: Reusable UI components (e.g., `Navbar`, `Hero`, `WorkflowStatusAction`, `PayBookingButton`).
- **`models/`**: Mongoose schemas defining the rigid data structures (`User`, `Property`, `Booking`, `Lease`, `MaintenanceRequest`, etc.).
- **`utils/`**: Core utilities including authorization (`getActor`), route protection, and external integrations.
- **`config/`**: Database connections, admin permissions (`admin.js`), and organization logic (`organizations.js`).

## 🚀 Getting Started

### 1. Environment Configuration
Copy the sample environment file and fill in the required credentials:
```bash
cp .env.example .env.local
```
*Make sure to configure your `MONGO_URI`, NextAuth secrets, Google OAuth credentials, and Cloudinary keys.*

### 2. Installation
Install the project dependencies:
```bash
npm install
```

### 3. Verification
Verify your environment variables are correctly set up:
```bash
npm run check:env
```

### 4. Development
Start the local development server (runs on `http://localhost:3000`):
```bash
npm run dev
```
*Note: The server intentionally uses port 3000 to align with standard OAuth callback configurations. Stop any existing processes on port 3000 before running.*

## 🧪 Testing & Validation

The platform includes structural and security testing:
```bash
npm run lint    # Code linting
npm run test    # Non-browser structural/security tests
npm run build   # Production build validation
```

## 🗄 Data Migration
For commercial migrations or database updates, use the built-in scripts. **Always perform a database backup before applying migrations.**

```bash
npm run migrate:commercial         # Dry-run migration
npm run migrate:commercial:apply   # Apply changes to the database
```

## 🔒 Security Notes
- **RBAC**: All server routes strictly enforce `getActor()` to verify identity and roles.
- **Data Integrity**: Massive strings (like Base64 image URLs) are blocked from bloating JWT cookies; session data dynamically hydrates from MongoDB.
- **Secrets**: API keys and secrets must never be committed.

---
*Built for scale, speed, and real estate excellence.*

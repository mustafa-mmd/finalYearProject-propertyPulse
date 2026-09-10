import mongoose from "mongoose";
import Link from "next/link";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import PaymentForm from "@/components/PaymentForm";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ searchParams }) {
  const params = await searchParams;
  const propertyId = params?.propertyId;

  if (!mongoose.isValidObjectId(propertyId)) {
    return <PaymentUnavailable message="Select a valid property before paying." />;
  }

  await connectDB();
  const property = await Property.findById(propertyId)
    .select("name rates currency")
    .lean();

  if (!property) {
    return <PaymentUnavailable message="This property is no longer available." />;
  }

  return (
    <main className="container mx-auto px-6 py-10">
      <div className="mx-auto mb-6 max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Secure checkout
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Complete your payment
        </h1>
        <p className="mt-2 text-gray-600">{property.name}</p>
      </div>
      <PaymentForm
        propertyId={propertyId}
        rates={{
          nightly: property.rates?.nightly ?? null,
          weekly: property.rates?.weekly ?? null,
          monthly: property.rates?.monthly ?? null,
        }}
        currency={property.currency || "ZAR"}
      />
    </main>
  );
}

function PaymentUnavailable({ message }) {
  return (
    <main className="container mx-auto px-6 py-20 text-center">
      <h1 className="text-2xl font-bold text-gray-900">Payment unavailable</h1>
      <p className="mt-3 text-gray-600">{message}</p>
      <Link
        href="/properties"
        className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Browse properties
      </Link>
    </main>
  );
}

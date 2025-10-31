//currently not in use
'use client';

import PaymentForm from "@/components/PaymentForm";
import { useSearchParams } from "next/navigation";

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const nightly = searchParams.get("nightly");
  const weekly = searchParams.get("weekly");
  const monthly = searchParams.get("monthly");



  return (
    <div className="container mx-auto py-10 px-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Payment</h1>
      <PaymentForm 
        propertyId={propertyId} 
        nightly={nightly} 
        weekly={weekly} 
        monthly={monthly} 
      />
    </div>
  );
}






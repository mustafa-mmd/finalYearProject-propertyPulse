'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Spinner from "@/components/Spinner";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const { data: session, update } = useSession();
  const profileName = session?.user?.name;
  const profileEmail = session?.user?.email;
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Failed to update profile picture");
      }

      const updatedImageUrl = payload.data?.user?.image;
      await update({ user: { image: updatedImageUrl } });
      toast.success("Profile picture updated successfully!");
    } catch (err) {
      console.error("Profile picture upload error:", err);
      toast.error(err.message || "Error uploading profile picture");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;

    setUploadingImage(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrlInput.trim() }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error?.message || "Failed to update profile image URL");
      }

      const updatedImageUrl = payload.data?.user?.image;
      await update({ user: { image: updatedImageUrl } });
      toast.success("Profile picture URL updated successfully!");
      setShowUrlInput(false);
      setImageUrlInput("");
    } catch (err) {
      console.error("Image URL update error:", err);
      toast.error(err.message || "Error updating image URL");
    } finally {
      setUploadingImage(false);
    }
  };

  const [subscription, setSubscription] = useState(null);
  const isPlatformOwner =
    session?.user?.roles?.includes("PLATFORM_OWNER") ||
    session?.user?.email?.toLowerCase() === "mustafajamalshabqadar@gmail.com";

  useEffect(() => {
    const fetchUserProperties = async (userId) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/prop/user/${userId}`);
        if (res.status === 200) {
          const data = await res.json();
          setProperties(data);
        } else {
          console.error("Failed to fetch properties:", res.status);
          toast.error("Failed to load your properties");
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
        toast.error("Error loading properties");
      } finally {
        setLoading(false);
      }
    };

    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/subscriptions");
        if (res.ok) {
          const payload = await res.json();
          setSubscription(payload.data?.subscription || null);
        }
      } catch (err) {
        console.error("Error fetching subscription:", err);
      }
    };

    if (session?.user?.id) {
      fetchUserProperties(session.user.id);
      fetchSubscription();
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleDeleteProperty = async (propertyId) => {
    const confirmed = window.confirm("Are you sure you want to delete this property?");
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/prop/${propertyId}`, { 
        method: 'DELETE' 
      });
      
      if (res.status === 200) {
        const updatedProperties = properties.filter((property) => property._id !== propertyId);
        setProperties(updatedProperties);
        toast.success("Property deleted successfully");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to delete property");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete property");
    }
  };

  const handleSubmitForReview = async (propertyId) => {
    try {
      const res = await fetch(`/api/listings/${propertyId}/submit`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        const missing = payload.error?.details?.missing;
        toast.error(
          missing?.length
            ? `Complete these sections first: ${missing.join(", ")}`
            : payload.error?.message || "Listing could not be submitted"
        );
        return;
      }
      setProperties((current) =>
        current.map((property) =>
          property._id === propertyId
            ? { ...property, listingStatus: payload.data?.status || "PUBLISHED", completenessScore: payload.data?.completenessScore || 100 }
            : property
        )
      );
      if (payload.data?.status === "PUBLISHED" || isPlatformOwner) {
        toast.success("🚀 Property published successfully! It is now live on the platform.");
      } else {
        toast.success("Listing submitted for review!");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to publish listing");
    }
  };

  return (
    <section className="bg-blue-50 min-h-screen">
      <div className="container m-auto py-24">
        <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
          <div className="flex flex-col md:flex-row">
            {/* Profile Info Section */}
            <div className="md:w-1/3 mx-auto md:mx-10 mt-6 text-center md:text-left">
              <div className="mb-6 flex flex-col items-center md:items-start">
                <div className="relative group w-36 h-36 md:w-44 md:h-44 mb-3">
                  <UserAvatar
                    src={session?.user?.image}
                    alt={profileName || "User Profile"}
                    className="h-36 w-36 md:h-44 md:w-44 rounded-full border-4 border-blue-300 object-cover shadow-md transition group-hover:brightness-90"
                    width={300}
                    height={300}
                    priority
                  />
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer font-medium text-xs md:text-sm text-center p-2"
                  >
                    {uploadingImage ? (
                      <span className="animate-pulse">Uploading...</span>
                    ) : (
                      <>
                        <span className="text-2xl mb-1">📷</span>
                        <span>Change Photo</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-[220px]">
                  <label
                    htmlFor="profile-image-upload"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow cursor-pointer transition"
                  >
                    <span>📷</span>
                    <span>{uploadingImage ? "Uploading..." : "Upload Profile Photo"}</span>
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setShowUrlInput((v) => !v)}
                    className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-lg transition"
                  >
                    <span>🔗</span>
                    <span>{showUrlInput ? "Cancel URL Input" : "Paste Image URL"}</span>
                  </button>

                  {showUrlInput && (
                    <form onSubmit={handleUrlSubmit} className="mt-2 flex flex-col gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/photo.jpg"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={uploadingImage}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition"
                      >
                        Save Photo URL
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <h2 className="text-xl mb-3">
                <span className="font-bold block text-gray-600">Name: </span>
                <span className="text-blue-800">{profileName || "Not available"}</span>
              </h2>
              <h2 className="text-xl mb-4">
                <span className="font-bold block text-gray-600">Email: </span>
                <span className="text-blue-800">{profileEmail || "Not available"}</span>
              </h2>

              {/* Subscription / Plan Status Card */}
              {(() => {
                const statusColors = {
                  ACTIVE:    { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", dot: "bg-emerald-500" },
                  TRIALING:  { bg: "bg-blue-100",    text: "text-blue-800",    border: "border-blue-300",    dot: "bg-blue-500"    },
                  PAST_DUE:  { bg: "bg-amber-100",   text: "text-amber-800",   border: "border-amber-300",   dot: "bg-amber-500"   },
                  PAUSED:    { bg: "bg-slate-100",   text: "text-slate-700",   border: "border-slate-300",   dot: "bg-slate-400"   },
                  CANCELLED: { bg: "bg-red-100",     text: "text-red-800",     border: "border-red-300",     dot: "bg-red-500"     },
                };
                const status = subscription?.status || "FREE";
                const sc = statusColors[status] || statusColors.ACTIVE;

                const trialEnd = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
                const now = new Date();
                const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / 86_400_000)) : 0;
                const isTrial = status === "TRIALING" && trialEnd;
                const renewsAt = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;

                const usedListings = properties.length;
                const maxListings = subscription?.limitsSnapshot?.activeListings;
                const unlimited = isPlatformOwner || maxListings === -1 || maxListings == null;
                const usedPct = unlimited ? 0 : Math.min(100, Math.round((usedListings / (maxListings || 1)) * 100));
                const teamSeats = subscription?.limitsSnapshot?.teamMembers;

                return (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Header — always show both badges if both apply */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan Status</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isPlatformOwner && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                            👑 Platform Owner
                          </span>
                        )}
                        {subscription ? (
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            {status}
                          </span>
                        ) : !isPlatformOwner ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                            FREE
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                      {subscription ? (
                        <>
                          {/* Plan name + billing interval */}
                          <div className="flex items-baseline justify-between">
                            <p className="text-sm font-bold text-slate-900">
                              {subscription.planCode?.replace(/_/g, " ")} Plan
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {subscription.billingInterval?.toLowerCase()}
                            </p>
                          </div>

                          {/* Trial countdown */}
                          {isTrial && (
                            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                              <p className="text-xs font-semibold text-blue-700">
                                🎯 Free trial — <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}</strong> remaining
                              </p>
                              <p className="mt-0.5 text-[10px] text-blue-500">
                                Trial ends {trialEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          )}

                          {/* Renews / Expires */}
                          {renewsAt && (
                            <p className="text-xs text-slate-500">
                              {status === "CANCELLED" ? "⚠️ Expires" : isTrial ? "💳 Billing starts" : "🔄 Renews"}{" "}
                              <strong className="text-slate-700">
                                {renewsAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </strong>
                            </p>
                          )}

                          {/* Listing usage bar */}
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-[11px] font-semibold text-slate-600">Listings used</span>
                              <span className="text-[11px] font-bold text-slate-800">
                                {usedListings} / {unlimited ? "∞" : maxListings}
                              </span>
                            </div>
                            {!unlimited && (
                              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${usedPct >= 90 ? "bg-red-500" : usedPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${usedPct}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Team seats */}
                          {teamSeats != null && (
                            <p className="text-[11px] text-slate-500">
                              👥 Team seats:{" "}
                              <strong className="text-slate-700">
                                {isPlatformOwner || teamSeats === -1 ? "Unlimited" : teamSeats}
                              </strong>
                            </p>
                          )}

                          <Link
                            href="/pricing"
                            className="block w-full rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
                          >
                            Manage Subscription →
                          </Link>
                        </>
                      ) : isPlatformOwner ? (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Full platform access enabled. Unlimited listings, team seats, and zero limits across all features.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500">You are on the free plan.</p>
                          <p className="text-xs text-slate-600">
                            Listings: <strong>{usedListings}</strong> / <strong>1</strong>
                          </p>
                          <Link
                            href="/pricing"
                            className="block w-full rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
                          >
                            Upgrade Plan →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Properties Section */}
            <div className="md:w-3/4 md:pl-8 mt-8 md:mt-0">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Listings</h2>
              
              {loading ? (
                <div className="flex justify-center">
                  <Spinner loading={loading} />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-lg mb-4">You have no property listings yet.</p>
                  <Link 
                    href="/properties/add" 
                    className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Your First Property
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {properties.map((property) => (
                    <div key={property._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Property Image with Link */}
                        <div className="md:w-1/3">
                          <Link href={`/properties/${property._id}`}>
                            <Image
                              className="h-48 w-full rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              src={property.images?.[0] || "/images/default-property.jpg"}
                              alt={property.name || "Property"}
                              width={400}
                              height={200}
                              priority={true}
                            />
                          </Link>
                        </div>
                        
                        {/* Property Details */}
                        <div className="md:w-2/3">
                          {/* Property Name as Link */}
                          <Link href={`/properties/${property._id}`}>
                            <p className="text-xl font-semibold text-blue-900 mb-2 hover:text-blue-700 cursor-pointer">
                              {property.name || "Unnamed Property"}
                            </p>
                          </Link>
                          
                          <p className="text-gray-600 mb-2">
                            <span className="font-medium">Address:</span> {property.location?.street} {property.location?.city} {property.location?.state}
                          </p>
                          <p className="text-gray-600 mb-4">
                            <span className="font-medium">Type:</span> {property.type} | 
                            <span className="font-medium"> Beds:</span> {property.beds} | 
                            <span className="font-medium"> Baths:</span> {property.baths}
                          </p>
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {property.listingStatus || "LEGACY PUBLISHED"}
                            </span>
                            <span className="text-xs text-slate-500">
                              Completeness: {property.completenessScore ?? 100}%
                            </span>
                            {property.listingReference && (
                              <span className="font-mono text-xs text-slate-500">{property.listingReference}</span>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <Link 
                              href={`/properties/${property._id}/edit`}
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                            >
                              Edit Property
                            </Link>
                            <button
                              onClick={() => handleDeleteProperty(property._id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                              type="button"
                            >
                              Delete Property
                            </button>
                            <Link 
                              href={`/properties/${property._id}`}
                              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                            >
                              View Details
                            </Link>
                            {/* Publish / Submit Action Button */}
                            {["DRAFT", "INCOMPLETE", "CHANGES_REQUESTED"].includes(property.listingStatus) && (
                              <button
                                type="button"
                                onClick={() => handleSubmitForReview(property._id)}
                                className={`rounded-md px-4 py-2 text-white font-bold transition-all shadow ${
                                  isPlatformOwner
                                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 ring-2 ring-emerald-300"
                                    : "bg-violet-600 hover:bg-violet-700"
                                }`}
                              >
                                {isPlatformOwner ? "Publish Property 🚀" : "Submit for Review"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;

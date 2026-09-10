"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "react-toastify";
import PropertyLocationFields from "@/components/PropertyLocationFields";
import { EMPTY_LOCATION, hasUsableLocation } from "@/utils/location";
import { LISTING_CATEGORIES } from "@/config/listings";
import SearchableCurrencySelect from "@/components/SearchableCurrencySelect";
import { detectUserCurrency } from "@/utils/currency";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaBed,
  FaDollarSign,
  FaImages,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaHome,
  FaHandHoldingUsd,
  FaCalendarAlt,
  FaFileAlt,
  FaUser,
  FaTimes,
  FaCloudUploadAlt,
  FaGripVertical,
  FaStar,
} from "react-icons/fa";

const PURPOSE_OPTIONS = [
  {
    id: "LONG_TERM_RENT",
    label: "Rent",
    icon: FaHome,
    badgeBg: "bg-blue-100 text-blue-600",
    activeBadgeBg: "bg-blue-600 text-white shadow-md shadow-blue-500/30",
    desc: "Long-term residential",
  },
  {
    id: "SALE",
    label: "Buy / Sale",
    icon: FaHandHoldingUsd,
    badgeBg: "bg-emerald-100 text-emerald-600",
    activeBadgeBg: "bg-emerald-600 text-white shadow-md shadow-emerald-500/30",
    desc: "For outright sale",
  },
  {
    id: "SHORT_TERM_RENT",
    label: "Short Stays",
    icon: FaCalendarAlt,
    badgeBg: "bg-amber-100 text-amber-600",
    activeBadgeBg: "bg-amber-500 text-white shadow-md shadow-amber-500/30",
    desc: "Nightly & weekly bookings",
  },
  {
    id: "COMMERCIAL_LEASE",
    label: "Commercial",
    icon: FaBuilding,
    badgeBg: "bg-purple-100 text-purple-600",
    activeBadgeBg: "bg-purple-600 text-white shadow-md shadow-purple-500/30",
    desc: "Offices & industrial",
  },
];



const AMENITY_LIST = [
  "Wifi", "Full Kitchen", "Washer & Dryer", "Free Parking", "Swimming Pool", "Hot Tub",
  "24/7 Security", "Wheelchair Accessible", "Elevator Access", "Dishwasher",
  "Gym/Fitness Center", "Air Conditioning", "Balcony/Patio", "Smart TV", "Coffee Maker",
];

const emptyField = {
  name: "",
  type: "APARTMENT",
  listingPurpose: "LONG_TERM_RENT",
  listingCategory: "APARTMENT",
  organizationId: "",
  currency: "ZAR",
  description: "",
  location: { ...EMPTY_LOCATION },
  beds: "",
  baths: "",
  square_feet: "",
  amenities: [],
  rates: {
    nightly: { enabled: false, price: "" },
    weekly: { enabled: false, price: "" },
    monthly: { enabled: false, price: "" },
    custom: { enabled: false, price: "", unit: "days", duration: "" },
  },
  pricing: { salePrice: "", monthlyRent: "" },
  seller_info: { name: "", email: "", phone: "" },
  images: [],
};

const STEPS = [
  { title: "Purpose & Category", description: "Purpose, category & currency" },
  { title: "Details", description: "Listing name & description" },
  { title: "Location", description: "Address & map pin" },
  { title: "Amenities", description: "Rooms, sizes & features" },
  { title: "Pricing", description: "Rates & sale settings" },
  { title: "Images & Owner", description: "Photos & contact info" },
];

export default function PropertyAddForm({ organizations = [] }) {
  const { data: session } = useSession();
  const isPlatformOwner =
    session?.user?.roles?.includes("PLATFORM_OWNER") ||
    session?.user?.roles?.includes("SUPER_ADMIN") ||
    session?.user?.email?.toLowerCase() === "mustafajamalshabqadar@gmail.com";
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Wizard active step state (0 to 5)
  const [currentStep, setCurrentStep] = useState(0);

  const [field, setField] = useState({ ...emptyField, location: { ...EMPTY_LOCATION } });
  
  // Track image URLs for previews & drag-and-drop state
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedImageIdx, setDraggedImageIdx] = useState(null);

  useEffect(() => {
    setMounted(true);
    const localCurrency = detectUserCurrency();
    setField((prev) => ({
      ...prev,
      currency: localCurrency,
    }));
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [outerKey, innerKey] = name.split(".");
      setField((prev) => ({
        ...prev,
        [outerKey]: { ...prev[outerKey], [innerKey]: value },
      }));
    } else {
      setField((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAmenitiesChange = (e) => {
    const { value, checked } = e.target;
    setField((prev) => {
      const updated = [...prev.amenities];
      if (checked && !updated.includes(value)) updated.push(value);
      else if (!checked) {
        const idx = updated.indexOf(value);
        if (idx !== -1) updated.splice(idx, 1);
      }
      return { ...prev, amenities: updated };
    });
  };

  const allAmenitiesSelected = field.amenities.length === AMENITY_LIST.length;
  const handleSelectAllAmenities = () => {
    setField((prev) => ({
      ...prev,
      amenities: allAmenitiesSelected ? [] : [...AMENITY_LIST],
    }));
  };

  const addImages = (files) => {
    const fileList = Array.from(files || []);
    if (!fileList.length) return;

    const validFiles = fileList.filter(
      (f) =>
        ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(f.type) &&
        f.size <= 10 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      toast.error("Please upload JPEG, PNG, WebP or AVIF images under 10MB each.");
      return;
    }

    const remainingSlots = Math.max(0, 10 - field.images.length);
    const allowedFiles = validFiles.slice(0, remainingSlots);

    if (fileList.length > allowedFiles.length) {
      toast.warning("Only up to 10 valid images (max 10 MB each) are accepted.");
    }

    if (!allowedFiles.length) return;

    // Create preview URLs cleanly outside of state updater callbacks to prevent duplicate URL creation
    const newUrls = allowedFiles.map((file) => URL.createObjectURL(file));

    setField((prev) => ({
      ...prev,
      images: [...prev.images, ...allowedFiles],
    }));

    setImagePreviews((prevUrls) => [...prevUrls, ...newUrls]);
  };

  const handleImageInputChange = (e) => {
    addImages(e.target.files);
    e.target.value = "";
  };

  const handleDropzoneDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDropzoneDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDropzoneDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveImage = (index) => {
    setField((prev) => {
      const copy = [...prev.images];
      copy.splice(index, 1);
      return { ...prev, images: copy };
    });
    setImagePreviews((prevUrls) => {
      const copy = [...prevUrls];
      if (copy[index]) URL.revokeObjectURL(copy[index]);
      copy.splice(index, 1);
      return copy;
    });
  };

  const moveImage = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= field.images.length || fromIdx === toIdx) return;

    setField((prev) => {
      const nextImages = [...prev.images];
      const [moved] = nextImages.splice(fromIdx, 1);
      nextImages.splice(toIdx, 0, moved);
      return { ...prev, images: nextImages };
    });

    setImagePreviews((prevUrls) => {
      const nextUrls = [...prevUrls];
      const [moved] = nextUrls.splice(fromIdx, 1);
      nextUrls.splice(toIdx, 0, moved);
      return nextUrls;
    });
  };

  const handleThumbnailDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedImageIdx(index);
  };

  const handleThumbnailDragOver = (e) => {
    e.preventDefault();
  };

  const handleThumbnailDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedImageIdx === null || draggedImageIdx === targetIndex) return;
    moveImage(draggedImageIdx, targetIndex);
    setDraggedImageIdx(null);
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 0) {
      if (!field.listingPurpose) {
        toast.error("Please select a listing purpose.");
        return;
      }
    } else if (currentStep === 1) {
      if (!field.name.trim()) {
        toast.error("Please enter a property name.");
        return;
      }
    } else if (currentStep === 2) {
      if (!hasUsableLocation(field.location)) {
        toast.error("Please specify a valid street address and place the map pin.");
        return;
      }
    } else if (currentStep === 3) {
      if (field.beds === "" || field.baths === "") {
        toast.error("Beds and baths fields are required.");
        return;
      }
    } else if (currentStep === 4) {
      if (field.listingPurpose === "SALE" && !field.pricing.salePrice) {
        toast.error("Please provide the sale price.");
        return;
      }
      const isRent = field.listingPurpose === "SHORT_TERM_RENT" || field.listingPurpose === "LONG_TERM_RENT" || field.listingPurpose === "COMMERCIAL_LEASE";
      if (isRent) {
        const anyEnabled = Object.values(field.rates).some((r) => r.enabled);
        if (!anyEnabled) {
          toast.error("Please enable and set at least one rental rate (Nightly, Weekly, Monthly, or Custom).");
          return;
        }
        const missingPrice = Object.entries(field.rates).find(([, r]) => r.enabled && !r.price);
        if (missingPrice) {
          toast.error(`Please enter a price for the enabled ${missingPrice[0]} rate.`);
          return;
        }
        const customRate = field.rates.custom;
        if (customRate.enabled && (!customRate.duration || Number(customRate.duration) < 1)) {
          toast.error("Please enter a valid duration for the custom rate.");
          return;
        }
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!field.seller_info.email.trim()) {
      toast.error("Please enter a contact email address.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", field.name);
      formData.append("type", field.type);
      formData.append("listingPurpose", field.listingPurpose);
      formData.append("listingCategory", field.listingCategory);
      formData.append("organizationId", field.organizationId);
      formData.append("currency", field.currency);
      formData.append("description", field.description);
      formData.append("beds", field.beds);
      formData.append("baths", field.baths);
      formData.append("square_feet", field.square_feet);
      formData.append("location", JSON.stringify(field.location));
      
      const isRent = ["SHORT_TERM_RENT", "LONG_TERM_RENT", "COMMERCIAL_LEASE"].includes(field.listingPurpose);
      if (isRent) {
        // Serialize enabled rates into formData
        formData.append("rates", JSON.stringify(field.rates));
      }
      if (field.listingPurpose === "SALE") {
        formData.append("pricing[salePrice]", field.pricing.salePrice);
      } else if (field.listingPurpose === "LONG_TERM_RENT" || field.listingPurpose === "COMMERCIAL_LEASE") {
        // monthly rent = the monthly rate price if enabled, else 0
        const mr = field.rates.monthly.enabled ? field.rates.monthly.price : "";
        formData.append("pricing[monthlyRent]", mr);
      }

      Object.entries(field.seller_info).forEach(([k, v]) => formData.append(`seller_info[${k}]`, v));
      field.amenities.forEach((a) => formData.append("amenities[]", a));
      field.images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/prop", { method: "POST", body: formData });
      if (res.ok) {
        if (isPlatformOwner) {
          toast.success("✅ Property published successfully! It is now live on the platform.");
        } else {
          toast.success("Draft listing saved. You can submit it for review from your profile.");
        }
        setField({
          ...emptyField,
          location: { ...EMPTY_LOCATION },
          organizationId: field.organizationId,
          currency: field.currency,
        });
        setImagePreviews([]);
        setTimeout(() => router.push("/profile"), 1500);
      } else {
        const payload = await res.json().catch(() => null);
        toast.error(payload?.error?.message || "The draft listing could not be saved.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An unexpected error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const isShortTerm = field.listingPurpose === "SHORT_TERM_RENT";
  const isSale = field.listingPurpose === "SALE";
  const isLongTermOrCommercial =
    field.listingPurpose === "LONG_TERM_RENT" || field.listingPurpose === "COMMERCIAL_LEASE";
  const isAnyRent = isShortTerm || isLongTermOrCommercial;

  // Helper to toggle a rate type on/off
  const toggleRate = (rateKey) => {
    setField((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [rateKey]: { ...prev.rates[rateKey], enabled: !prev.rates[rateKey].enabled },
      },
    }));
  };

  // Helper to update a rate field value
  const setRateField = (rateKey, fieldName, value) => {
    setField((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [rateKey]: { ...prev.rates[rateKey], [fieldName]: value },
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      
      {/* Step Progress Indicators */}
      <div className="bg-slate-50 border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">Add Property</h2>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-6 gap-2">
          {STEPS.map((step, idx) => {
            const active = idx === currentStep;
            const completed = idx < currentStep;
            return (
              <div key={idx} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active ? "bg-blue-600" : completed ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
                <span className={`hidden md:block text-[11px] font-bold truncate ${active ? "text-blue-600" : "text-slate-500"}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Step 0: Purpose & Category */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaHome className="text-blue-600" /> Choose Purpose
              </h3>
              <p className="text-sm text-slate-500 mt-1">Select listing type, category, and preferred currency.</p>
            </div>

            {organizations.length > 0 && (
              <label className="block text-sm font-bold text-slate-800">
                Listing Owner / Organization
                <select
                  name="organizationId"
                  value={field.organizationId}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
                >
                  <option value="">Personal Portfolio</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PURPOSE_OPTIONS.map((item) => {
                const active = field.listingPurpose === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setField((prev) => ({ ...prev, listingPurpose: item.id }))}
                    className={`flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                      active
                        ? "border-blue-600 bg-blue-50/60 shadow-lg shadow-blue-500/10 scale-[1.02]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold transition-colors ${
                        active ? item.activeBadgeBg : item.badgeBg
                      }`}
                    >
                      <Icon />
                    </div>
                    <span className="text-base font-extrabold text-slate-950 block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block leading-normal">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-slate-800">
                Property Category
                <select
                  name="listingCategory"
                  value={field.listingCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    setField((prev) => ({
                      ...prev,
                      listingCategory: val,
                      type: val,
                    }));
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 outline-none focus:border-blue-500 transition"
                >
                  {LISTING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <div className="block text-sm font-bold text-slate-800">
                <label className="block mb-2">Currency</label>
                <SearchableCurrencySelect
                  value={field.currency}
                  onChange={(code) => setField((prev) => ({ ...prev, currency: code }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaFileAlt className="text-blue-600" /> Basic Listing Details
              </h3>
              <p className="text-sm text-slate-500 mt-1">Specify name and write a descriptive summary.</p>
            </div>

            {/* Show selected category from Step 1 as a read-only badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category:</span>
              <span className="inline-flex items-center rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm font-extrabold text-blue-700">
                {field.listingCategory.replaceAll("_", " ")}
              </span>
              <span className="text-xs text-slate-400">(set in Step 1)</span>
            </div>
            <label className="block text-sm font-bold text-slate-800">
              Property Name
              <input
                type="text"
                name="name"
                required
                value={field.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 transition font-medium"
                placeholder="e.g. Beautiful Beachfront Condo"
              />
            </label>

            <label className="block text-sm font-bold text-slate-800">
              Description
              <textarea
                name="description"
                value={field.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-blue-500 transition"
                placeholder="Share unique selling points of the property..."
              />
            </label>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-600" /> Property Location
              </h3>
              <p className="text-sm text-slate-500 mt-1">Confirm exact street address and coordinates.</p>
            </div>

            <PropertyLocationFields
              value={field.location}
              onChange={(location) => setField((prev) => ({ ...prev, location }))}
            />
          </div>
        )}

        {/* Step 3: Attributes & Amenities */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaBed className="text-blue-600" /> Attributes &amp; Amenities
              </h3>
              <p className="text-sm text-slate-500 mt-1">Specify layout detail and tick included features.</p>
            </div>

            <div className="grid gap-4 grid-cols-3">
              <label className="block text-sm font-bold text-slate-800">
                Beds
                <input
                  type="number"
                  name="beds"
                  required
                  min="0"
                  value={field.beds}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-955 outline-none focus:border-blue-500 transition"
                />
              </label>
              <label className="block text-sm font-bold text-slate-800">
                Baths
                <input
                  type="number"
                  name="baths"
                  required
                  min="0"
                  value={field.baths}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-955 outline-none focus:border-blue-500 transition"
                />
              </label>
              <label className="block text-sm font-bold text-slate-800">
                Square Feet
                <input
                  type="number"
                  name="square_feet"
                  min="0"
                  value={field.square_feet}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-955 outline-none focus:border-blue-500 transition"
                />
              </label>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-800">Included Amenities</label>
                <button
                  type="button"
                  onClick={handleSelectAllAmenities}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    allAmenitiesSelected
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {allAmenitiesSelected ? (
                    <>
                      <span>✓</span> Deselect All
                    </>
                  ) : (
                    <>
                      <span>☐</span> Select All ({AMENITY_LIST.length})
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMENITY_LIST.map((amenity) => {
                  const safeId = `amenity_${amenity.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
                  return (
                    <label
                      key={amenity}
                      htmlFor={safeId}
                      className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-sm font-semibold transition cursor-pointer select-none ${
                        field.amenities.includes(amenity)
                          ? "border-blue-600 bg-blue-50/55 text-blue-800"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id={safeId}
                        name="amenities"
                        value={amenity}
                        checked={field.amenities.includes(amenity)}
                        onChange={handleAmenitiesChange}
                        className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      {amenity}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaDollarSign className="text-blue-600" /> Pricing &amp; Rental Rates
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {isAnyRent
                  ? `Enable each rental type you want to offer. At least one is required. Currency: ${field.currency}`
                  : "Specify pricing structure based on purpose."}
              </p>
            </div>

            {/* ── Rental Rate Cards (all rent types) ── */}
            {isAnyRent && (
              <div className="space-y-3">

                {/* Nightly */}
                <div className={`rounded-2xl border-2 transition-all duration-200 ${
                  field.rates.nightly.enabled
                    ? "border-blue-500 bg-blue-50/40 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 text-lg">🌙</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Nightly Rate</p>
                        <p className="text-xs text-slate-500">Per night — ideal for Airbnb-style stays</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRate("nightly")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        field.rates.nightly.enabled ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        field.rates.nightly.enabled ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  {field.rates.nightly.enabled && (
                    <div className="px-5 pb-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Price per night ({field.currency}) *
                      </label>
                      <input
                        type="number" min="0" placeholder="e.g. 5000"
                        value={field.rates.nightly.price}
                        onChange={(e) => setRateField("nightly", "price", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* Weekly */}
                <div className={`rounded-2xl border-2 transition-all duration-200 ${
                  field.rates.weekly.enabled
                    ? "border-blue-500 bg-blue-50/40 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-600 text-lg">📅</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Weekly Rate</p>
                        <p className="text-xs text-slate-500">Per week — short-term extended stays</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRate("weekly")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        field.rates.weekly.enabled ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        field.rates.weekly.enabled ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  {field.rates.weekly.enabled && (
                    <div className="px-5 pb-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Price per week ({field.currency}) *
                      </label>
                      <input
                        type="number" min="0" placeholder="e.g. 25000"
                        value={field.rates.weekly.price}
                        onChange={(e) => setRateField("weekly", "price", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* Monthly */}
                <div className={`rounded-2xl border-2 transition-all duration-200 ${
                  field.rates.monthly.enabled
                    ? "border-blue-500 bg-blue-50/40 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 text-lg">🏠</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Monthly Rate</p>
                        <p className="text-xs text-slate-500">Per month — standard long-term rental</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRate("monthly")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        field.rates.monthly.enabled ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        field.rates.monthly.enabled ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  {field.rates.monthly.enabled && (
                    <div className="px-5 pb-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Price per month ({field.currency}) *
                      </label>
                      <input
                        type="number" min="0" placeholder="e.g. 85000"
                        value={field.rates.monthly.price}
                        onChange={(e) => setRateField("monthly", "price", e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                </div>

                {/* Custom Duration */}
                <div className={`rounded-2xl border-2 transition-all duration-200 ${
                  field.rates.custom.enabled
                    ? "border-purple-500 bg-purple-50/40 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600 text-lg">⚙️</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Custom Duration Rate</p>
                        <p className="text-xs text-slate-500">Set any fixed duration — 3 months, 6 months, 1 year, 45 days…</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRate("custom")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        field.rates.custom.enabled ? "bg-purple-600" : "bg-slate-200"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                        field.rates.custom.enabled ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  {field.rates.custom.enabled && (
                    <div className="px-5 pb-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Duration *</label>
                          <input
                            type="number" min="1" placeholder="e.g. 6"
                            value={field.rates.custom.duration}
                            onChange={(e) => setRateField("custom", "duration", e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Unit *</label>
                          <select
                            value={field.rates.custom.unit}
                            onChange={(e) => setRateField("custom", "unit", e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          >
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Total price for this duration ({field.currency}) *
                        </label>
                        <input
                          type="number" min="0" placeholder="e.g. 450000"
                          value={field.rates.custom.price}
                          onChange={(e) => setRateField("custom", "price", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-bold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </div>
                      {field.rates.custom.duration && field.rates.custom.price && (
                        <p className="text-xs text-purple-700 font-semibold bg-purple-50 rounded-lg px-3 py-2">
                          📌 {field.currency} {Number(field.rates.custom.price).toLocaleString()} for {field.rates.custom.duration} {field.rates.custom.unit}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Rate Summary Card */}
                {Object.values(field.rates).some((r) => r.enabled) && (
                  <div className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pricing Summary</p>
                    <div className="flex flex-wrap gap-2">
                      {field.rates.nightly.enabled && field.rates.nightly.price && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1.5">
                          🌙 {field.currency} {Number(field.rates.nightly.price).toLocaleString()} / night
                        </span>
                      )}
                      {field.rates.weekly.enabled && field.rates.weekly.price && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1.5">
                          📅 {field.currency} {Number(field.rates.weekly.price).toLocaleString()} / week
                        </span>
                      )}
                      {field.rates.monthly.enabled && field.rates.monthly.price && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1.5">
                          🏠 {field.currency} {Number(field.rates.monthly.price).toLocaleString()} / month
                        </span>
                      )}
                      {field.rates.custom.enabled && field.rates.custom.price && field.rates.custom.duration && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1.5">
                          ⚙️ {field.currency} {Number(field.rates.custom.price).toLocaleString()} / {field.rates.custom.duration} {field.rates.custom.unit}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSale && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
                <label className="block text-sm font-bold text-slate-800">
                  Sale Price ({field.currency}) *
                  <input
                    type="number"
                    required
                    min="0"
                    name="pricing.salePrice"
                    placeholder="e.g. 2500000"
                    value={field.pricing.salePrice}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 font-bold text-lg text-slate-900"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Images & Owner Info */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaImages className="text-blue-600" /> Property Photos &amp; Owner Details
              </h3>
              <p className="text-sm text-slate-500 mt-1">Upload matching images and confirm seller details.</p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <label className="block text-sm font-bold text-slate-800">
                  Property Images ({field.images.length}/10)
                </label>
                {imagePreviews.length > 1 && (
                  <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-lg">
                    💡 Drag cards or use arrows to reorder (1st is main cover)
                  </span>
                )}
              </div>

              {/* Drag & Drop File Upload Zone */}
              <div className="w-full">
                <label
                  onDragOver={handleDropzoneDragOver}
                  onDragLeave={handleDropzoneDragLeave}
                  onDrop={handleDropzoneDrop}
                  className={`flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    isDraggingOver
                      ? "border-blue-600 bg-blue-50/90 scale-[1.01] shadow-lg ring-4 ring-blue-100"
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                    <FaCloudUploadAlt
                      className={`text-4xl mb-2 transition-transform ${
                        isDraggingOver
                          ? "text-blue-600 scale-110 animate-bounce"
                          : "text-slate-400"
                      }`}
                    />
                    <p className="text-xs font-bold text-slate-700">
                      {isDraggingOver
                        ? "Drop your photos here to upload"
                        : "Drag & drop photos here or click to browse"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      JPEG, PNG, WebP or AVIF (max 10MB each, up to 10 photos)
                    </p>
                  </div>
                  <input
                    type="file"
                    id="images"
                    name="images"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    onChange={handleImageInputChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Reorderable Image Previews Grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mt-4">
                  {imagePreviews.map((url, idx) => {
                    const isCover = idx === 0;
                    const isDraggingThis = draggedImageIdx === idx;

                    return (
                      <div
                        key={url}
                        draggable
                        onDragStart={(e) => handleThumbnailDragStart(e, idx)}
                        onDragOver={handleThumbnailDragOver}
                        onDrop={(e) => handleThumbnailDrop(e, idx)}
                        onDragEnd={() => setDraggedImageIdx(null)}
                        className={`relative group aspect-video rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${
                          isCover
                            ? "border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                            : "border-slate-200 shadow-sm"
                        } ${
                          isDraggingThis
                            ? "opacity-40 scale-95 border-dashed border-blue-400"
                            : "hover:shadow-md hover:border-slate-300"
                        }`}
                      >
                        {/* eslint-disable-next-html-element-for-img */}
                        <img
                          src={url}
                          alt={`preview-${idx}`}
                          className="h-full w-full object-cover select-none pointer-events-none"
                        />

                        {/* Cover Badge */}
                        {isCover && (
                          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                            <FaStar className="text-yellow-300 text-[9px]" /> Cover
                          </div>
                        )}

                        {/* Drag grip icon hint */}
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/70 text-white p-1 rounded-md text-xs pointer-events-none">
                          <FaGripVertical />
                        </div>

                        {/* Hover Action Overlay */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, idx - 1)}
                                className="bg-white/90 hover:bg-white text-slate-800 rounded-lg p-1.5 text-xs shadow font-bold transition hover:scale-105"
                                title="Move Left / Make Cover"
                              >
                                <FaArrowLeft />
                              </button>
                            )}
                            {idx < imagePreviews.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, idx + 1)}
                                className="bg-white/90 hover:bg-white text-slate-800 rounded-lg p-1.5 text-xs shadow font-bold transition hover:scale-105"
                                title="Move Right"
                              >
                                <FaArrowRight />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="bg-red-600 text-white rounded-lg p-1.5 text-xs shadow hover:bg-red-700 transition hover:scale-105"
                            title="Delete image"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <FaUser className="text-blue-600 text-sm" />
                <p className="font-extrabold text-slate-800 text-sm">Seller Information</p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-bold text-slate-700">
                  Seller Name
                  <input
                    type="text"
                    name="seller_info.name"
                    value={field.seller_info.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 font-semibold"
                    placeholder="Full name"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Seller Email *
                  <input
                    type="email"
                    name="seller_info.email"
                    required
                    value={field.seller_info.email}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 font-semibold"
                    placeholder="Email address"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-700">
                  Seller Phone
                  <input
                    type="tel"
                    name="seller_info.phone"
                    value={field.seller_info.phone}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 font-semibold"
                    placeholder="Phone number"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between gap-3 border-t border-slate-150 pt-6">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <FaArrowLeft /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              Next <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {submitting ? "Saving Draft..." : "Save Draft Listing"}
              {!submitting && <FaCheckCircle />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

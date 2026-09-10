// import {Schema,model,models} from "mongoose";
// const PropertySchema = new Schema({
//   owner:[{
//     type:Schema.Types.ObjectId,
//     ref:"User",
//     required:true,}],
//     name:{
//     type:String,  
//     required:[true,"Please provide a name"],
//   },
//   type:{
//     type:String,  
//     required:[true,"Please provide a type"],
//   },
//   description:{
//     type:String,  
    
//   },
//   location:{
//     street:{
//       type:String,
      
//     },
//     city:{
//       type:String,
      
//     },
//     state:{
//       type:String,
      
//     },
//     zipcode:{
//       type:String,
//   }
// },
// beds:{
//     type:Number,
//     required:[true,"Please provide number of beds"]
//   },
//   baths:{
//     type:Number,
//     required:[true,"Please provide number of baths"]
//   },
//   square_feet:{
//     type:Number,
//     required:[true,"Please provide square feet"]
//   },
//   amenities:[{
//     type:String,
//   }],
//   rates:{
//     nightly:{
//       type:Number,
//       required:[true,"Please provide nightly rate"]
//     },
//     weekly:{
//       type:Number,
//       required:[true,"Please provide weekly rate"]
//     },
//     monthly:{
//       type:Number,
//       required:[true,"Please provide monthly rate"]
//     }
//   },
//   seller_info:{
//     name:{
//       type:String,
      
//     },
//     email:{
//       type:String,
      
//     },
//     phone:{
//       type:String,
      
//     }
//   },
//   images:[{
//     type:String,
    
//   }],
//   is_featured:{
//     type:Boolean,
//     default:false,
//   },
// },{timestamps:true});

// const Property = models.Property || model("Property", PropertySchema);
// export default Property;




import mongoose from "mongoose";
import crypto from "node:crypto";
import {
  LISTING_CATEGORIES,
  LISTING_PURPOSES,
  LISTING_STATUSES,
} from "@/config/listings";
import { SUPPORTED_CURRENCIES } from "@/config/international";

const { Schema, model, models } = mongoose;

const PropertySchema = new Schema({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    index: true,
  },
  owner: [{
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }],
  listingReference: {
    type: String,
    unique: true,
    sparse: true,
    immutable: true,
    default: () =>
      `PP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
  },
  listingPurpose: {
    type: String,
    enum: LISTING_PURPOSES,
    default: "LONG_TERM_RENT",
    index: true,
  },
  listingCategory: {
    type: String,
    enum: LISTING_CATEGORIES,
    default: "OTHER",
    index: true,
  },
  listingStatus: {
    type: String,
    enum: LISTING_STATUSES,
    default: "DRAFT",
    index: true,
  },
  completenessScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  statusHistory: [
    {
      status: { type: String, enum: LISTING_STATUSES, required: true },
      changedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, maxlength: 1000 },
      at: { type: Date, default: Date.now },
    },
  ],
  submittedAt: Date,
  approvedAt: Date,
  publishedAt: Date,
  expiresAt: Date,
  archivedAt: Date,
  deletedAt: Date,
  name: {
    type: String,
    required: [true, "Please provide a name"],
  },
  type: {
    type: String,
    required: [true, "Please provide a type"],
  },
  description: {
    type: String,
  },
  location: {
    formattedAddress: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    country: {
      type: String,
      trim: true,
    },
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
    // Kept for existing records and older clients.
    zipcode: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number],
        default: undefined,
        validate: {
          validator: (coordinates) =>
            !coordinates?.length ||
            (coordinates.length === 2 &&
              coordinates[0] >= -180 &&
              coordinates[0] <= 180 &&
              coordinates[1] >= -90 &&
              coordinates[1] <= 90),
          message: "Location coordinates must be [longitude, latitude]",
        },
      },
    },
    placeId: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
    },
    accuracy: {
      type: String,
      trim: true,
    },
    resolutionStatus: {
      type: String,
      enum: ["resolved", "coordinates_only", "pending", "unresolved"],
      default: "unresolved",
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    geocodedAt: Date,
    lastGeocodeAttemptAt: Date,
  },
  beds: {
    type: Number,
    default: 1,
    min: 0,
  },
  baths: {
    type: Number,
    default: 1,
    min: 0,
  },
  square_feet: {
    type: Number,
    default: 0,
    min: 0,
  },
  amenities: [String],
  rates: {
    nightly: {
      type: Number,
      min: 0,
    },
    weekly: {
      type: Number,
      min: 0,
    },
    monthly: {
      type: Number,
      min: 0,
    },
  },
  currency: {
    type: String,
    enum: SUPPORTED_CURRENCIES,
    default: "ZAR",
    uppercase: true,
  },
  pricing: {
    salePrice: { type: Number, min: 0 },
    monthlyRent: { type: Number, min: 0 },
    securityDeposit: { type: Number, min: 0 },
    cleaningFee: { type: Number, min: 0 },
    serviceFee: { type: Number, min: 0 },
    taxRate: { type: Number, min: 0, max: 100 },
    utilitiesIncluded: { type: Boolean, default: false },
    negotiable: { type: Boolean, default: false },
  },
  priceHistory: [
    {
      period: { type: String, enum: ["NIGHTLY", "WEEKLY", "MONTHLY", "SALE"], required: true },
      amount: { type: Number, min: 0, required: true },
      currency: { type: String, maxlength: 3, uppercase: true },
      changedBy: { type: Schema.Types.ObjectId, ref: "User" },
      changedAt: { type: Date, default: Date.now },
    },
  ],
  marketDetails: {
    furnishing: {
      type: String,
      enum: ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED", "NOT_APPLICABLE"],
      default: "NOT_APPLICABLE",
    },
    condition: {
      type: String,
      enum: ["NEW", "EXCELLENT", "GOOD", "FAIR", "RENOVATION_REQUIRED", "NOT_APPLICABLE"],
      default: "NOT_APPLICABLE",
    },
    availabilityDate: Date,
    minimumLeaseMonths: { type: Number, min: 0, max: 120 },
    petsAllowed: { type: Boolean },
    parkingSpaces: { type: Number, min: 0, max: 100 },
    floorNumber: { type: Number, min: -10, max: 500 },
    yearBuilt: { type: Number, min: 1000, max: 2200 },
    energyRating: { type: String, maxlength: 20 },
    accessibilityFeatures: [{ type: String, maxlength: 100 }],
    virtualTourUrl: { type: String, maxlength: 2000 },
    openHouseAvailable: { type: Boolean, default: false },
  },
  policies: {
    cancellation: { type: String, maxlength: 3000 },
    refund: { type: String, maxlength: 3000 },
    leaseRequirements: { type: String, maxlength: 3000 },
    propertyRules: [{ type: String, maxlength: 500 }],
  },
  seller_info: {
    name: String,
    email: String,
    phone: String,
  },
  images: [String],
  media: [
    {
      type: {
        type: String,
        enum: ["IMAGE", "VIDEO", "VIRTUAL_TOUR", "FLOOR_PLAN", "BROCHURE"],
        required: true,
      },
      url: { type: String, required: true, maxlength: 2000 },
      publicId: { type: String, maxlength: 500 },
      caption: { type: String, maxlength: 300 },
      order: { type: Number, min: 0, default: 0 },
      isCover: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  verification: {
    status: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "IN_REVIEW", "APPROVED", "VERIFIED", "CHANGES_REQUESTED", "REJECTED", "EXPIRED"],
      default: "NOT_SUBMITTED",
      index: true,
    },
    riskScore: { type: Number, min: 0, max: 100 },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
    expiresAt: Date,
  },
  metrics: {
    views: { type: Number, default: 0, min: 0 },
    inquiries: { type: Number, default: 0, min: 0 },
    saves: { type: Number, default: 0, min: 0 },
    viewingRequests: { type: Number, default: 0, min: 0 },
    bookingRequests: { type: Number, default: 0, min: 0 },
  },
  is_featured: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

PropertySchema.index({ type: 1, "location.city": 1, "location.state": 1 });
PropertySchema.index({ tenantId: 1, listingStatus: 1, createdAt: -1 });
PropertySchema.index({ listingPurpose: 1, listingCategory: 1, listingStatus: 1 });
PropertySchema.index({ listingStatus: 1, publishedAt: -1 });
PropertySchema.index({ "verification.status": 1, "verification.riskScore": -1 });
PropertySchema.index({ deletedAt: 1 }, { sparse: true });
PropertySchema.index({ "location.coordinates": "2dsphere" }, { sparse: true });
PropertySchema.index({ beds: 1, baths: 1, square_feet: 1 });
PropertySchema.index({
  "rates.nightly": 1,
  "rates.weekly": 1,
  "rates.monthly": 1,
});
PropertySchema.index({ is_featured: -1, createdAt: -1 });
PropertySchema.index({ "priceHistory.changedAt": -1 });

const Property = models?.Property || model("Property", PropertySchema);
export default Property;

import connectDB from "../config/database.js";
import Property from "../models/Property.js";

async function checkProperties() {
  await connectDB();
  const props = await Property.find({ deletedAt: { $exists: false } }).lean();
  console.log("Total active properties:", props.length);
  props.forEach((p) => {
    console.log({
      id: p._id.toString(),
      name: p.name,
      listingPurpose: p.listingPurpose,
      listingStatus: p.listingStatus,
      rates: p.rates,
      pricing: p.pricing,
    });
  });
  process.exit(0);
}

checkProperties();

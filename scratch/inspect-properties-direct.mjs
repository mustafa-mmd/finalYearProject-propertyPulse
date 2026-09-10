import dns from "node:dns";
import fs from "node:fs";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const envFile = fs.readFileSync(".env.local", "utf8");
const match = envFile.match(/MONGO_URI=(.+)/);
const mongoUri = match ? match[1].trim() : "";

async function checkProperties() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const collection = db.collection("properties");
  const props = await collection.find({ deletedAt: { $exists: false } }).toArray();
  console.log("Total active properties:", props.length);
  props.forEach((p) => {
    console.log({
      id: p._id.toString(),
      name: p.name,
      listingPurpose: p.listingPurpose,
      listingStatus: p.listingStatus,
      type: p.type,
      rates: p.rates,
      pricing: p.pricing,
    });
  });
  process.exit(0);
}

checkProperties();

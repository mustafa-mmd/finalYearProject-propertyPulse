import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://mustafajamalshabqadar:8aTq74o3jrxPOfHM@cluster0.hnovu5d.mongodb.net/propertypulse?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  
  const db = mongoose.connection.db;
  const property = await db.collection("properties").findOne({ _id: new mongoose.Types.ObjectId("68d922445d3411fc42f388e5") });
  
  console.log("Property Document:", JSON.stringify(property, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);

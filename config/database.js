// import mongoose from "mongoose";
// let connected = false;
// const connectDB = async () => {
//   mongoose.set("strictQuery", true);
//   //if the  database is already connected,don't connect again
//   if (connected) {
//     console.log("MongoDB is already connected");
//     return;

//   }
//   //connect to the database
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     connected = true;
//     console.log("MongoDB connected successfully");
//   } catch (error) {
//     console.error("MongoDB connection failed:", error);
//   }
// }
// export default connectDB;




// import mongoose from "mongoose";

// const MONGO_URI = process.env.MONGO_URI;
// if (!MONGO_URI) {
//   throw new Error("Please define the MONGO_URI environment variable");
// }

// let cached = global.mongoose;

// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }

// async function connectDB() {
//   if (cached.conn) {
//     console.log("MongoDB is already connected");
//     return cached.conn;
//   }

//   if (!cached.promise) {
//     mongoose.set("strictQuery", true);
//     cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => {
//       console.log("MongoDB connected successfully");
//       return mongoose;
//     }).catch((error) => {
//       console.error("MongoDB connection failed:", error);
//       throw error;
//     });
//   }
//   cached.conn = await cached.promise;
//   return cached.conn;
// }

// export default connectDB;



import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable in .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    console.log("✅ Using existing MongoDB connection");
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    
    cached.promise = mongoose
      .connect(MONGO_URI)
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully");
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection failed:", error.message);
        // Reset the promise so we can try again
        cached.promise = null;
        throw error; // Re-throw the error to handle it upstream
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Reset both connection and promise on error
    cached.conn = null;
    cached.promise = null;
    throw error;
  }
}

export default connectDB;

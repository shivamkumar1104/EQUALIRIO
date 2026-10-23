import mongoose from "mongoose";
import dns from "node:dns";

// Fix for querySrv ECONNREFUSED with MongoDB Atlas SRV connection strings
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // fallback if DNS custom server cannot be set
}

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URL?.trim()) {
      throw new Error("MONGODB_URL environment variable is missing.");
    }

    const connection = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`mongodb connected: ${connection.connection.host} | Database: ${connection.connection.name}`);
  } catch (error) {
    if (error.message === "MONGODB_URL environment variable is missing.") {
      throw error;
    }

    throw new Error(
      "MongoDB connection failed. Check MONGODB_URL, Atlas network access, and database credentials.",
      { cause: error }
    );
  }
};

export default connectDB;
// mongodb.js
import mongoose from "mongoose";

class MongoDB {
  constructor() {
    const organizationSchema = new mongoose.Schema({
      name: { type: String, required: true },
      acronym: String,
      school: String,
      logoUrl: String,
      email: String,
      isWhitelisted: Boolean,
      createdBy: mongoose.Schema.Types.ObjectId,
      members: [mongoose.Schema.Types.ObjectId],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    });

    // ✅ Explicitly set the collection name to "Organizations"
    this.Organization =
      mongoose.models.Organization ||
      mongoose.model("Organization", organizationSchema, "Organizations");
  }

  async connect() {
    try {
      await mongoose.connect(
        "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering"
      );
      console.log("✅ Connected to MongoDB Atlas (Web-Tech database)");
    } catch (error) {
      console.error("❌ Connection failed:", error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    } catch (error) {
      console.error("Error while disconnecting:", error.message);
    }
  }
}

const mongoDB = new MongoDB();
mongoDB.connect();

export const Organization = mongoDB.Organization;
export default mongoDB;

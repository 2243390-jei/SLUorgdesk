// mongodb.js
import mongoose from "mongoose";

// ✅ Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering"
    );
    console.log("✅ Connected to MongoDB Atlas (Web-Tech database)");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
};

// ✅ Organization Schema
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

// ✅ Form Schema — matches your MongoDB structure exactly
const formSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  completeName: String,
  acronym: String,
  officialEmail: String,
  socialMediaLinks: [String],
  applicantName: String,
  adviserEmails: [String],
  school: String,
  category: String,
  organizationType: String,
  applicantPosition: String,
  applicantEmail: String,
  adviserNames: [String],
  strategicPlans: {
    fileName: String,
    fileUrl: String,
  },
  annualReport: {
    fileName: String,
    fileUrl: String,
  },
  constitutionByLaws: {
    fileName: String,
    fileUrl: String,
  },
  cblStatus: String,
  infographics: {
    fileName: String,
    fileUrl: String,
  },
  videoLink: String,
  submittedBy: mongoose.Schema.Types.ObjectId,
  status: String,
  remarks: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ Fix: collection names (remove accidental trailing space)
export const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema, "Organizations");

export const Form =
  mongoose.models.Form || mongoose.model("Form", formSchema, "Form");

// ✅ Immediately connect on import
connectDB();

export default mongoose;

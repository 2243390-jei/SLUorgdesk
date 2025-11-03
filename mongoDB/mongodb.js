import mongoose from "mongoose";

// Connect immediately
const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering"
    );
    console.log("Connected to MongoDB Atlas (Web-Tech database)");
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
};

// Submission Schema (matches new DB example)
const submissionSchema = new mongoose.Schema({
  applicationInfo: {
    applicantName: String,
    email: String,
    position: String
  },
  orgInfo: {
    orgId: String,
    name: String,
    acronym: String,
    email: String
  },
  academicYear: String,
  semester: String,
  event: {
    id: String,
    eventName: String,
    eventType: String,
    eventDate: String,
    startTime: String,
    endTime: String,
    eventVenue: String,
    eventDescription: String,
    attendance: Number,
    eventProof: String,
    eventSDG: [String],
    supportingDocuments: [String]
  },
  documentUploads: {
    strategic_plan: { fileName: String, url: String },
    annual_report: { fileName: String, url: String },
    cbl: { fileName: String, url: String },
    cbl_status: String,
    officers_list: { fileName: String, url: String },
    infographic: { fileName: String, url: String },
    financial_statement: { fileName: String, url: String },
    video_link: String,
  },
  additional_note: String,
  confirmation: Boolean,
  status: String,
  remarks: String,
  submittedAt: { type: Date, default: Date.now },
});

export const Submission =
  mongoose.models.Submission ||
  mongoose.model("Submission", submissionSchema, "Submissions");

// Export Organization too
const organizationSchema = new mongoose.Schema({
  name: String,
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

export const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema, "Organizations");

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  studentId: String,
  school: String,
  course: String,
  yearLevel: Number,
  isActive: { type: Boolean, default: true },
  organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model("User", userSchema, "User");

connectDB();
export default mongoose;

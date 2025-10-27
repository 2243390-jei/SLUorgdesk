// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Organization, Form } from "./mongodb.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("✅ Server is running and connected to MongoDB!");
});

// Fetch all organizations
app.get("/api/organizations", async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ message: "Error fetching organizations" });
  }
});

// Fetch all forms
app.get("/api/forms", async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${forms.length} forms in database`);
    res.json(forms);
  } catch (error) {
    console.error("❌ Error fetching forms:", error);
    res.status(500).json({ message: "Error fetching forms", error: error.message });
  }
});

// ✅ Route: Get submissions for a specific organization
app.get("/api/Submissions/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    const Submissions = await mongoose.connection.db
      .collection("Submissions")
      .find({ organizationId: new mongoose.Types.ObjectId(organizationId) })
      .toArray();

    console.log(`✅ Found ${Submissions.length} submissions for org ${organizationId}`);
    res.json(Submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
});

// 🟢 Route to get a single submission by ID (linked to Form collection via formId)
app.get("/api/Submission/:submissionId", async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }

    // 1️⃣ Find submission from Submissions collection
    const submission = await mongoose.connection.db
      .collection("Submissions")
      .findOne({ _id: new mongoose.Types.ObjectId(submissionId) });

    if (!submission) {
      console.log("❌ Submission not found in Submissions collection");
      return res.status(404).json({ message: "Submission not found" });
    }

    console.log("✅ Found submission:", submission);

    // 2️⃣ Link to Form document via formId
    let formDetails = null;
    if (submission.formId && mongoose.Types.ObjectId.isValid(submission.formId)) {
      formDetails = await mongoose.connection.db
        .collection("Form")
        .findOne({ _id: new mongoose.Types.ObjectId(submission.formId) });
    } else {
      console.log("⚠️ No valid formId found in submission.");
    }

    console.log("✅ Linked form details:", formDetails);

    // 3️⃣ Return merged data
    res.json({
      ...submission,
      formDetails: formDetails || {},
    });
  } catch (error) {
    console.error("❌ Error fetching submission details:", error);
    res.status(500).json({ message: "Error fetching submission details", error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
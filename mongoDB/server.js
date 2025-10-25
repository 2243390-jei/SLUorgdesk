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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

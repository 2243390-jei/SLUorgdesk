import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Organization, Submission } from "./mongodb.js";



const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running and connected to MongoDB!");
});

// Fetch all organizations
app.get("/api/Organizations", async (req, res) => {
  try {
    const organizations = await Organization.find();
    res.json(organizations);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ message: "Error fetching organizations" });
  }
});

// Get all submissions
app.get("/api/Submissions", async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ submittedAt: -1 });
    console.log(`Found ${submissions.length} total submissions`);
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching all submissions:", error);
    res.status(500).json({ message: "Error fetching all submissions" });
  }
});

// Fetch all forms
app.get("/api/forms", async (req, res) => {
  try {
    const forms = await Form.find().sort({ createdAt: -1 });
    console.log(`Found ${forms.length} forms in database`);
    res.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ message: "Error fetching forms", error: error.message });
  }
});

// Get all submissions for a specific organization
app.get("/api/Submissions/:organizationId", async (req, res) => {
  try {
    const { organizationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    const submissions = await Submission.find({ organizationId }).sort({ submittedAt: -1 });

    console.log(`Found ${submissions.length} submissions for org ${organizationId}`);
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
});


// Logic to get a submission using the ID
app.get("/api/Submission/:submissionId", async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }

    // Find a submission from the Submissions collection in the mongoDB
    const submission = await mongoose.connection.db
      .collection("Submissions")
      .findOne({ _id: new mongoose.Types.ObjectId(submissionId) });

    if (!submission) {
      console.log("Submission not found in Submissions collection");
      return res.status(404).json({ message: "Submission not found" });
    }

    console.log("Found submission:", submission);

    // Link a specific Form document using the formId element
    let formDetails = null;
    if (submission.formId && mongoose.Types.ObjectId.isValid(submission.formId)) {
      formDetails = await mongoose.connection.db
        .collection("Form")
        .findOne({ _id: new mongoose.Types.ObjectId(submission.formId) });
    } else {
      console.log("No valid formId found in submission.");
    }

    console.log("Linked form details:", formDetails);

    // Return merged data
    res.json({
      ...submission,
      formDetails: formDetails || {},
    });
  } catch (error) {
    console.error("Error fetching submission details:", error);
    res.status(500).json({ message: "Error fetching submission details", error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
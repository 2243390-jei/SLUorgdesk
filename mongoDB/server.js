// server.js
import express from "express";
import cors from "cors";
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

// ✅ FIXED ROUTE NAME — lowercase plural to match frontend
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
    

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
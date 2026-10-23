const express = require("express");
const Hazard = require("../models/Hazard");

const router = express.Router();

// Create a new hazard report
router.post("/", async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      location,
      reportedBy,
      imageUrl
    } = req.body;

    if (
      !title ||
      !category ||
      !location ||
      !location.address||
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number" ||
      !reportedBy
    ) {
      return res.status(400).json({
        message: "Please provide title, category, valid location, and reportedBy."
      });
    }

    const hazard = await Hazard.create({
      title,
      description,
      category,
      severity,
      location,
      reportedBy,
      imageUrl
    });

    res.status(201).json({
      message: "Hazard report created successfully!",
      hazard
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create hazard report.",
      error: error.message
    });
  }
});

// Get all hazard reports
router.get("/", async (req, res) => {
  try {
    const hazards = await Hazard.find().sort({ createdAt: -1 });
    res.json(hazards);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch hazard reports."
    });
  }
});

module.exports = router;
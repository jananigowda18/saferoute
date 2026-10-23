const mongoose = require("mongoose");

const hazardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      required: true,
      enum: [
        "pothole",
        "damaged_road",
        "streetlight",
        "unsafe_area",
        "other"
      ]
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["reported", "verified", "in_progress", "resolved"],
      default: "reported"
    },
    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    },
    reportedBy: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hazard", hazardSchema);
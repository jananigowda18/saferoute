require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const hazardRoutes = require("./routes/Hazards");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/hazards", hazardRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("SafeRoute Community Backend is running!");
});

// Test MongoDB connection and start server
async function startServer() {
  await connectDB();

  app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}
module.exports=router;
startServer();
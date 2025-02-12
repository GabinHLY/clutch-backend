require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const pandascoreRoutes = require("./routes/pandascoreRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/pandascore", pandascoreRoutes);
app.use("/api", teamRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));

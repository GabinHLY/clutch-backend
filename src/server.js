require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const pandascoreRoutes = require("./routes/pandascoreRoutes");
const teamRoutes = require("./routes/teamRoutes");
const { saveUpcomingMatches } = require("./utils/updateMatches"); // 🔥 Import de la mise à jour des matchs
const { router: oddsRouter } = require("./services/oddsScraper"); // ✅ Corrigé pour extraire seulement le router

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
app.use("/api/odds", oddsRouter); // ✅ Utilise uniquement le router

const PORT = process.env.PORT || 3000;

// ✅ Lancer la mise à jour des matchs au démarrage du serveur
(async () => {
  try {
    console.log("🚀 Mise à jour initiale des matchs à venir...");
    await saveUpcomingMatches();
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour initiale :", error);
  }
})();

// ✅ Planifier une mise à jour toutes les 5 minutes
setInterval(async () => {
  try {
    console.log("🔄 Mise à jour automatique des matchs...");
    await saveUpcomingMatches();
  } catch (error) {
    console.error("❌ Erreur dans la mise à jour automatique :", error);
  }
}, 5 * 60 * 1000); // 5 minutes

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));

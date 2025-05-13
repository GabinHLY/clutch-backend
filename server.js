import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import matchRoutes from "./routes/matches.js";
import teamRoutes from "./routes/teams.js";
import playerRoutes from "./routes/players.js";
import { startMatchSyncJob } from "./cron/fetchJob.js";
import { startTokenJob } from "./cron/tokenJob.js";


dotenv.config();

const app = express();

// ✅ CORS doit venir avant tout
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/matches", matchRoutes);
app.use("/teams", teamRoutes);
app.use("/players", playerRoutes);

startMatchSyncJob();
startTokenJob();



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

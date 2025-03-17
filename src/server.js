import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from "path";

import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import { syncMatches } from './interfaces/matchController.js';
import './infrastructure/matchCronJob.js'; // Importer pour activer les tâches cron

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL, // ex: "http://localhost:5173"
    credentials: true,
    methods: ['GET','POST','PATCH','DELETE'],
    allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// Routes API
app.use('/api/users', userRoutes);
app.use('/api', matchRoutes);
app.use('/api', teamRoutes);

// Permet d'accéder aux images dans /uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
    console.error("❌ ERREUR SERVEUR :", err);
    res.status(500).json({ error: "Une erreur interne est survenue." });
});

// Test de la synchronisation au démarrage
syncMatches()
    .then(() => console.log("✅ Synchronisation des matchs réussie au démarrage"))
    .catch((err) => console.error("❌ Erreur lors de la synchronisation des matchs :", err.message));

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur : http://localhost:${PORT}`);
});
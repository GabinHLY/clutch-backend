import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import path from "path";

import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import { 
    syncMatches, 
    updateLiveScores, 
    updateTbdTeams, 
    updateMatchStatus, 
    completeMatch 
} from './interfaces/matchController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 Ajout du CORS avec `credentials: true` pour permettre l’envoi de cookies
app.use(cors({
    origin: process.env.FRONTEND_URL, // ⚠️ Mets ici l’URL de ton frontend (ex: "http://localhost:5173")
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ✅ Routes API
app.use('/api/users', userRoutes);
app.use('/api', matchRoutes);
app.use('/api', teamRoutes);

// ✅ Permet d’accéder aux images dans `/uploads`
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 🕒 Automatisation des mises à jour avec CRON
cron.schedule('* * * * *', async () => {
    console.log('🔄 Mise à jour automatique des matchs en direct...');
    try {
        await updateLiveScores();
        console.log('✅ Scores mis à jour.');
    } catch (err) {
        console.error('❌ Erreur lors de la mise à jour des scores:', err.message);
    }
});

// ✅ Test de la synchronisation au démarrage
syncMatches()
    .then(() => console.log("✅ Test de synchro auto réussi"))
    .catch((err) => console.error("❌ Erreur lors du test de synchro auto :", err.message));

app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));

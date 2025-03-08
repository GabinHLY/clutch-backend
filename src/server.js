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
    updateLiveScores 
} from './interfaces/matchController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Vérification des variables d’environnement essentielles
if (!process.env.FRONTEND_URL) {
    console.error("❌ ERREUR : FRONTEND_URL n'est pas défini dans le fichier .env");
    process.exit(1);
}

// 🔥 Configuration CORS (gestion des cookies entre le front et le back)
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Autoriser ces méthodes
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// ✅ Routes API
app.use('/api/users', userRoutes);
app.use('/api', matchRoutes);
app.use('/api', teamRoutes);

// ✅ Permet d’accéder aux images dans `/uploads`
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 🛠 Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
    console.error("❌ ERREUR SERVEUR :", err);
    res.status(500).json({ error: "Une erreur interne est survenue." });
});

// 🕒 Automatisation des mises à jour avec CRON (exécuté chaque minute)
cron.schedule('* * * * *', async () => {
    console.log('🔄 Mise à jour automatique des scores en direct...');
    try {
        await updateLiveScores();
        console.log('✅ Scores mis à jour avec succès.');
    } catch (err) {
        console.error('❌ Erreur lors de la mise à jour des scores:', err.message);
    }
});

// ✅ Test de la synchronisation au démarrage
syncMatches()
    .then(() => console.log("✅ Synchronisation des matchs réussie au démarrage"))
    .catch((err) => console.error("❌ Erreur lors de la synchronisation des matchs :", err.message));

// 🚀 Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur : http://localhost:${PORT}`);
});

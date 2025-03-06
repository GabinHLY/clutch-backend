import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cron from 'node-cron';

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

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api', matchRoutes);
app.use('/api', teamRoutes);

// 🕒 Automatisation des mises à jour avec CRON

// 📌 Synchronisation des matchs à venir toutes les minutes
cron.schedule('* * * * *', async () => {
    console.log('🔄 Synchronisation automatique des matchs à venir...');
    try {
        await syncMatches();
        console.log('✅ Synchronisation des matchs à venir terminée.');
    } catch (err) {
        console.error('❌ Erreur lors de la synchronisation des matchs à venir:', err.message);
    }
});

// 📌 Mise à jour des scores en direct toutes les minutes
cron.schedule('* * * * *', async () => {
    console.log('🔄 Mise à jour des scores en direct...');
    try {
        await updateLiveScores();
        console.log('✅ Scores des matchs en direct mis à jour.');
    } catch (err) {
        console.error('❌ Erreur lors de la mise à jour des scores en direct:', err.message);
    }
});

// 📌 Vérification des matchs TBD toutes les 10 minutes
cron.schedule('*/10 * * * *', async () => {
    console.log('🔄 Vérification des matchs TBD...');
    try {
        await updateTbdTeams();
        console.log('✅ Mise à jour des équipes TBD terminée.');
    } catch (err) {
        console.error('❌ Erreur lors de la mise à jour des équipes TBD:', err.message);
    }
});

// 📌 Mise à jour du statut des matchs toutes les minutes
cron.schedule('* * * * *', async () => {
    console.log('🔄 Mise à jour automatique du statut des matchs...');
    try {
        await updateMatchStatus();
        console.log('✅ Statut des matchs mis à jour.');
    } catch (err) {
        console.error('❌ Erreur lors de la mise à jour automatique des statuts:', err.message);
    }
});

// 📌 Finalisation automatique des matchs toutes les 5 minutes (optionnel)
cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Finalisation automatique des matchs terminés...');
    try {
        await completeMatch();  // ⚠️ À adapter si la finalisation doit se faire avec des paramètres
        console.log('✅ Matches finalisés automatiquement.');
    } catch (err) {
        console.error('❌ Erreur lors de la finalisation automatique des matchs:', err.message);
    }
});

// ✅ Test de la synchronisation au démarrage
syncMatches()
    .then(() => console.log("✅ Test de synchro auto réussi"))
    .catch((err) => console.error("❌ Erreur lors du test de synchro auto :", err.message));

app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));

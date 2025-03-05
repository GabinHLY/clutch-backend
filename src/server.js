import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cron from 'node-cron';

import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import { autoSyncMatches } from './application/matchService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api', matchRoutes);
app.use('/api', teamRoutes);

// Planification automatique : lancement de la synchronisation toutes les minutes
cron.schedule('* * * * *', async () => {
  console.log('Début de la synchro automatique...');
  try {
    await autoSyncMatches();
    console.log('Fin de la synchro automatique.');
  } catch (err) {
    console.error('Erreur lors de la synchro automatique:', err.message);
  }
});

// Appel initial pour vérifier la synchronisation au démarrage
autoSyncMatches()
  .then(() => console.log("✅ Test de synchro auto réussi"))
  .catch((err) => console.error("❌ Erreur lors du test de synchro auto :", err.message));

app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));

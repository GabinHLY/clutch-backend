import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import cors from 'cors';
import './infrastructure/matchCronJob.js';
import teamRoutes from './routes/teamRoutes.js';
import { syncUpcomingMatchesToDB } from './application/matchService.js';

dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.use('/api/users', userRoutes);
app.use('/api', matchRoutes);
app.use('/api', teamRoutes);

syncUpcomingMatchesToDB()
    .then(() => console.log("✅ Test de synchronisation réussi"))
    .catch((err) => console.error("❌ Erreur lors du test de synchronisation :", err.message));


app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));

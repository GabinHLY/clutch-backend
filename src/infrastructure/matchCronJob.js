import cron from 'node-cron';
import { syncUpcomingMatchesToDB } from '../application/matchService.js';

// Automatiser la synchronisation toutes les heures
cron.schedule('0 * * * *', async () => {
    console.log('🔄 Synchronisation automatique des matchs à venir...');
    await syncUpcomingMatchesToDB();
    console.log('✅ Mise à jour terminée.');
});

export default cron;

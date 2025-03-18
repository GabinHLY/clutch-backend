// matchCronJob.js
import cron from 'node-cron';
import { 
    syncUpcomingMatchesToDB, 
    updateLiveMatchScores, 
    updateMatchesStatus
} from '../application/matchService.js';

// Synchronisation des matchs à venir toutes les heures
cron.schedule('0 * * * *', async () => {
    console.log('🔄 Synchronisation automatique des matchs à venir...');
    await syncUpcomingMatchesToDB();
    console.log('✅ Mise à jour terminée.');
});

// Mise à jour des scores en direct toutes les 2 minutes
cron.schedule('*/2 * * * *', async () => {
    console.log('🔄 Mise à jour automatique des scores en direct...');
    await updateLiveMatchScores();
    console.log('✅ Scores mis à jour.');
});

// Mise à jour des statuts de matchs toutes les minutes
cron.schedule('* * * * *', async () => {
    console.log('🔄 Vérification des statuts de matchs...');
    await updateMatchesStatus();
    console.log('✅ Statuts mis à jour.');
});

export default cron;

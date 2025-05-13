// cron/fetchJob.js

import cron from "node-cron";
import axios from "axios";
import axiosRetry from "axios-retry";
import fetchAndSyncMatches from "../scripts/fetchValorantMatches.js"; // ← default import

// 1. Configure axios : timeout + retry
axios.defaults.timeout = 10000; // 10 s max par requête
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) || error.code === "ECONNRESET",
});

export const startMatchSyncJob = () => {
  console.log(
    "⏱️ Démarrage du job de synchronisation des matchs (toutes les 5 minutes)"
  );

  cron.schedule("*/5 * * * *", async () => {
    try {
      await fetchAndSyncMatches();
      console.log("✅ Synchronisation terminée à", new Date().toISOString());
    } catch (err) {
      console.error("❌ Erreur pendant la synchronisation :", err.message);
    }
  });
};

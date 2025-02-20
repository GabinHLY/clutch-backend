const axios = require("axios");
const cheerio = require("cheerio");

// Fonction pour scraper une seule équipe Liquipedia
async function scrapeLiquipediaTeam(teamName) {
    try {
        const url = `https://liquipedia.net/valorant/${teamName.replace(/\s+/g, "_")}/Matches`;
        console.log(`🔍 Scraping de ${url}...`);

        const { data } = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
        });

        const $ = cheerio.load(data);

        // 🟢 Récupérer les 10 derniers matchs pour le calcul des cotes
        const allMatches = [];
        let totalRoundsWon = 0;
        let totalRoundsLost = 0;

        $("table.wikitable tbody tr").each((index, element) => {
            if (allMatches.length >= 10) return false;

            const columns = $(element).find("td");
            if (columns.length > 5) {
                const date = $(columns[0]).text().trim();
                const score = $(columns[5]).text().trim();
                const opponent = $(columns[6]).text().trim();

                const scoreMatch = score.match(/(\d+)\s*:\s*(\d+)/);
                if (!scoreMatch) return;

                const teamScore = parseInt(scoreMatch[1], 10);
                const opponentScore = parseInt(scoreMatch[2], 10);
                const isWin = teamScore > opponentScore ? 1 : 0;

                totalRoundsWon += teamScore;
                totalRoundsLost += opponentScore;

                allMatches.push({ date, score, opponent, isWin });
            }
        });

        console.log(`📋 ${allMatches.length} derniers matchs récupérés`);

        // 🟢 Séparation des 5 derniers matchs pour affichage sur le front
        const recentMatchesForDisplay = allMatches.slice(0, 5); // Garde les 5 plus récents

        // 🟢 Calcul des statistiques pour le calcul des cotes
        const totalMatches = allMatches.length;
        const totalWins = allMatches.reduce((acc, match) => acc + match.isWin, 0);
        const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(2) : null;

        const avgRoundsWon = totalMatches > 0 ? (totalRoundsWon / totalMatches).toFixed(2) : null;
        const avgRoundsLost = totalMatches > 0 ? (totalRoundsLost / totalMatches).toFixed(2) : null;
        const roundDifference = avgRoundsWon - avgRoundsLost;

        console.log(`📊 Winrate : ${winRate}%, Rounds gagnés : ${avgRoundsWon}, Rounds perdus : ${avgRoundsLost}`);

        return {
            team: teamName,
            winRate: parseFloat(winRate),
            roundDifference: parseFloat(roundDifference),
            matchesForOdds: allMatches, // 10 derniers matchs pour le calcul des cotes
            matchesForDisplay: recentMatchesForDisplay, // 5 derniers matchs pour le front
        };
    } catch (error) {
        console.error(`❌ Erreur lors du scraping de ${teamName} :`, error.message);
        return null;
    }
}

// Exporter la fonction pour pouvoir l'appeler depuis une route API
module.exports = { scrapeLiquipediaTeam };

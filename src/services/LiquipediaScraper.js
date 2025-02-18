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

        // 🟢 Récupérer les 10 derniers matchs
        const matches = [];
        let totalRoundsWon = 0;
        let totalRoundsLost = 0;

        $("table.wikitable tbody tr").each((index, element) => {
            if (matches.length >= 10) return false;

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

                matches.push({ date, score, opponent, isWin });
            }
        });

        console.log(`📋 ${matches.length} derniers matchs récupérés`);

        const totalMatches = matches.length;
        const totalWins = matches.reduce((acc, match) => acc + match.isWin, 0);
        const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(2) : null;

        const avgRoundsWon = totalMatches > 0 ? (totalRoundsWon / totalMatches).toFixed(2) : null;
        const avgRoundsLost = totalMatches > 0 ? (totalRoundsLost / totalMatches).toFixed(2) : null;
        const roundDifference = avgRoundsWon - avgRoundsLost;

        console.log(`📊 Winrate : ${winRate}%, Rounds gagnés : ${avgRoundsWon}, Rounds perdus : ${avgRoundsLost}`);

        return {
            team: teamName,
            winRate: parseFloat(winRate),
            roundDifference: parseFloat(roundDifference),
            recentMatches: matches,
        };
    } catch (error) {
        console.error(`❌ Erreur lors du scraping de ${teamName} :`, error.message);
        return null;
    }
}

// Exporter la fonction pour pouvoir l'appeler depuis une route API
module.exports = { scrapeLiquipediaTeam };

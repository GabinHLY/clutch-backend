const teamCache = require("../cache");
const { scrapeTeamData } = require("../services/scraper");

async function getTeamData(req, res) {
  try {
    let { slug } = req.params;
    console.log(`🔍 Demande de données pour : ${slug}`);

    if (!slug) {
      console.log("❌ Erreur : Aucun nom d'équipe fourni.");
      return res.status(400).json({ error: "Aucun nom d'équipe fourni." });
    }

    // ✅ Vérifie si les données sont en cache
    if (teamCache[slug]) {
      console.log(`📦 Données trouvées en cache pour ${slug} :`, JSON.stringify(teamCache[slug], null, 2));
      return res.json(teamCache[slug]);
    }

    // 🚀 Si non, on scrape
    console.log(`⏳ Données non trouvées en cache. Scraping en cours pour ${slug}...`);
    const data = await scrapeTeamData(slug);

    if (!data || !data.roster || data.roster.length === 0) {
      console.error(`❌ Scraping échoué ou aucun joueur trouvé pour ${slug}.`);
      return res.status(404).json({ error: `Impossible de récupérer les données pour ${slug}` });
    }

    // ✅ Stocke les données en cache pour éviter un rescraping inutile
    teamCache[slug] = data;
    console.log(`✅ Données stockées en cache pour ${slug} :`, JSON.stringify(data, null, 2));

    return res.json(data);
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}


module.exports = { getTeamData };

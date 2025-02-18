const pool = require("../config/db"); // Connexion à MySQL
const { scrapeTeamData } = require("../services/scraper");

async function getTeamData(req, res) {
    try {
        let { slug } = req.params;
        console.log(`🔍 Demande de données pour : ${slug}`);

        if (!slug) {
            console.log("❌ Erreur : Aucun nom d'équipe fourni.");
            return res.status(400).json({ error: "Aucun nom d'équipe fourni." });
        }

        // 1️⃣ Vérifier si les données existent déjà en base
        const [rows] = await pool.query("SELECT * FROM equipe WHERE nom = ?", [slug]);

        if (rows.length > 0) {
            console.log(`📦 Données trouvées en base pour ${slug} :`, JSON.stringify(rows[0], null, 2));
            return res.json(rows[0]);
        }

        // 2️⃣ Si non, scraper les données
        console.log(`⏳ Données non trouvées en base. Scraping en cours pour ${slug}...`);
        const data = await scrapeTeamData(slug);

        if (!data || !data.roster || data.roster.length === 0) {
            console.error(`❌ Scraping échoué ou aucun joueur trouvé pour ${slug}.`);
            return res.status(404).json({ error: `Impossible de récupérer les données pour ${slug}` });
        }

        // 3️⃣ Stocker en base de données
        await pool.query(
            "INSERT INTO equipe (nom, roster) VALUES (?, ?)",
            [slug, JSON.stringify(data.roster)]
        );

        console.log(`✅ Données stockées en base pour ${slug} :`, JSON.stringify(data, null, 2));

        return res.json(data);
    } catch (error) {
        console.error("❌ Erreur serveur :", error);
        return res.status(500).json({ error: "Erreur interne du serveur" });
    }
}

module.exports = { getTeamData };

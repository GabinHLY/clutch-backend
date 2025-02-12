const puppeteer = require("puppeteer");

// ✅ Fonction pour transformer le nom d'équipe en URL Liquipedia
function formatLiquipediaSlug(teamName) {
  return teamName
    .trim()
    .replace(/\s+/g, "_") // ✅ Remplace les espaces par "_"
    .split("")
    .map(char => /[a-zA-Z0-9_]/.test(char) ? char : encodeURIComponent(char)) // ✅ Encode les caractères spéciaux
    .join("");
}

async function scrapeTeamData(teamName) {
  const liquipediaSlug = formatLiquipediaSlug(teamName);
  const liquipediaURL = `https://liquipedia.net/valorant/${liquipediaSlug}`;

  console.log(`🔍 Scraping en cours pour : ${liquipediaURL}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], 
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    await page.goto(liquipediaURL, { waitUntil: "domcontentloaded" });
    await new Promise(r => setTimeout(r, 3000)); // Petit délai pour charger

    const rosterSelector = "td.ID .inline-player a";
    await page.waitForSelector(rosterSelector, { timeout: 10000 });

    const roster = await page.evaluate((rosterSelector) => {
      return Array.from(document.querySelectorAll(rosterSelector))
        .map(player => player.innerText.trim())
        .filter(pseudo => pseudo.length > 0)
        .slice(0, 5); 
    }, rosterSelector);

    console.log(`✅ Roster récupéré pour ${teamName} :`, roster);

    await browser.close();
    return { roster };
  } catch (error) {
    console.error(`❌ Erreur scraping Liquipedia pour ${teamName} :`, error);
    await browser.close();
    return null;
  }
}

module.exports = { scrapeTeamData };

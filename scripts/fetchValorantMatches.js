// scripts/fetchValorantMatches.js

import dotenv from "dotenv";
import axios from "axios";
import { db } from "../db/index.js";
import { matches, teams, players } from "../db/schema.js";
import { eq } from "drizzle-orm";

dotenv.config();

const PANDASCORE_TOKEN = process.env.PANDASCORE_TOKEN;
const BASE_URL = "https://api.pandascore.co";

const fetchFromPanda = async (endpoint, params = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${PANDASCORE_TOKEN}` },
    params,
  });
  return response.data;
};

const existsInTable = async (table, idField, idValue) => {
  const result = await db.select().from(table).where(eq(idField, idValue)).limit(1);
  return result.length > 0;
};

const saveTeamIfNeeded = async (team) => {
  if (!team) return;
  if (!(await existsInTable(teams, teams.id, team.id))) {
    await db.insert(teams).values({
      id: team.id,
      name: team.name,
      acronym: team.acronym,
      slug: team.slug,
      imageUrl: team.image_url,
    });

    const playersData = await fetchFromPanda("/valorant/players", { "filter[team_id]": team.id });
    for (const player of playersData) {
      if (!(await existsInTable(players, players.id, player.id))) {
        await db.insert(players).values({
          id: player.id,
          name: player.name,
          age: player.age,
          nationality: player.nationality,
          imageUrl: player.image_url,
          teamId: team.id,
        });
      }
    }
  }
};

const fetchAndSyncMatches = async () => {
  // On cherche à avoir 20 matchs à venir en base
  const currentUpcoming = await db.select().from(matches).where(eq(matches.status, "not_started"));
  const needed = 20 - currentUpcoming.length;

  if (needed > 0) {
    const matchData = await fetchFromPanda("/valorant/matches/upcoming", { per_page: 40, sort: "begin_at" });
    console.log("🔍 matchData:", matchData.length, "matchs récupérés depuis l'API");
    let added = 0;

    for (const match of matchData) {
      if (added >= needed) break;

      if (!match.opponents || match.opponents.length < 2 || match.opponents.some(o => !o.opponent)) {
        console.log(`⏭️ Match ${match.id} ignoré (équipes incomplètes ou TBD)`);
        continue;
      }

      console.log(`🟢 Match valide détecté : ${match.name} (${match.id})`);

      const matchId = match.id.toString();
      const existing = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
      if (existing.length) {
        console.log(`⚠️ Match ${matchId} déjà présent en BDD`);
        continue;
      }

      const opponents = match.opponents.map(o => o.opponent);
      const team1 = opponents[0];
      const team2 = opponents[1];

      if (team1) await saveTeamIfNeeded(team1);
      if (team2) await saveTeamIfNeeded(team2);

      // Construction des données avec correspondance schema
      const baseMatchData = {
        id: matchId,
        name: match.name,
        status: match.status,
        startTime: match.begin_at ? new Date(match.begin_at) : new Date(),
        tournamentName: match.league?.name || null,
        team1Id: team1?.id || null,
        team2Id: team2?.id || null,
        streamLink: match.streams_list?.[0]?.raw_url || null,
      };

      await db.insert(matches).values(baseMatchData);
      console.log(`✅ Insertion BDD : ${match.name}`);
      added++;
    }
  }

  const now = new Date();

  // Passer les matchs à 'running' quand l'heure d début est atteinte
  const toRun = await db.select().from(matches).where(eq(matches.status, "not_started"));
  for (const m of toRun) {
    if (m.startTime && now >= new Date(m.startTime)) {
      await db.update(matches).set({ status: "running" }).where(eq(matches.id, m.id));
      console.log(`▶️ Match ${m.id} passé à 'running'`);
    }
  }

  // Mettre à jour les matchs en cours vers 'finished' quand l'API l'indique
  const runningMatches = await db.select().from(matches).where(eq(matches.status, "running"));
  for (const m of runningMatches) {
    const liveMatch = await fetchFromPanda(`/matches/${m.id}`);
    if (liveMatch.status === "finished") {
      await db.update(matches).set({ status: "finished" }).where(eq(matches.id, m.id));
      console.log(`🏁 Match ${m.id} terminé (finished)`);
    }
  }
};

export default fetchAndSyncMatches;

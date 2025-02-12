const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'https://api.pandascore.co/';
const API_KEY = process.env.PANDASCORE_API_KEY;

// Configuration Axios pour centraliser les headers
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
});

// Récupérer les matchs à venir pour Valorant
async function getUpcomingValorantMatches() {
  try {
    const { data } = await axiosInstance.get('valorant/matches/upcoming');

    return data.slice(0, 20).map((match) => ({
      id: match.id,
      game: 'Valorant',
      team_a: {
        name: match.opponents[0]?.opponent.name || 'TBD',
        logo: match.opponents[0]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[0]?.opponent.id)?.score || 0,
      },
      team_b: {
        name: match.opponents[1]?.opponent.name || 'TBD',
        logo: match.opponents[1]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[1]?.opponent.id)?.score || 0,
      },
      serie: {
        name: match.serie?.name || 'Unknown Series',
        logo: match.league?.image_url || null,
      },
      start_time: match.begin_at,
      status: match.status,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs Valorant (upcoming) :', error.message);
    throw new Error('Impossible de récupérer les matchs Valorant à venir depuis PandaScore.');
  }
}

// Récupérer les matchs en direct pour Valorant
async function getRunningValorantMatches() {
  try {
    const { data } = await axiosInstance.get('valorant/matches/running');

    return data.map((match) => ({
      id: match.id,
      game: 'Valorant',
      team_a: {
        name: match.opponents[0]?.opponent.name || 'TBD',
        logo: match.opponents[0]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[0]?.opponent.id)?.score || 0,
      },
      team_b: {
        name: match.opponents[1]?.opponent.name || 'TBD',
        logo: match.opponents[1]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[1]?.opponent.id)?.score || 0,
      },
      serie: {
        name: match.serie?.name || 'Unknown Series',
        logo: match.league?.image_url || null,
      },
      start_time: match.begin_at,
      status: match.status,
      stream_url: match.streams_list?.find((stream) => stream.main)?.raw_url || null,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs Valorant (running) :', error.message);
    throw new Error('Impossible de récupérer les matchs Valorant en direct depuis PandaScore.');
  }
}

// Récupérer l'ID d'une équipe par son nom
async function getTeamByName(teamName) {
  try {
    const { data } = await axiosInstance.get('teams', {
      params: { search: teamName },
    });

    const team = data.find((t) => t.name.toLowerCase() === teamName.toLowerCase());
    return team ? team.id : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID de l\'équipe :', error.message);
    throw new Error('Impossible de récupérer l\'ID de l\'équipe.');
  }
}

// Récupérer les statistiques d'une équipe par son ID
async function getTeamStatsById(teamId) {
  try {
    const { data } = await axiosInstance.get(`teams/${teamId}`);
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de l\'équipe :', error.message);
    throw new Error('Impossible de récupérer les statistiques de l\'équipe.');
  }
}

// Récupérer toutes les équipes pour un jeu spécifique
async function getTeams(game) {
  try {
    const { data } = await axiosInstance.get(`${game}/teams`);
    return data.map((team) => ({
      id: team.id,
      name: team.name,
      slug: team.slug, // Utilisé pour générer des URLs Liquipedia
      logo: team.image_url || null,
    }));
  } catch (error) {
    console.error(`Erreur lors de la récupération des équipes pour le jeu ${game} :`, error.message);
    throw new Error('Impossible de récupérer les équipes depuis PandaScore.');
  }
}

// Récupérer les matchs terminés pour Valorant
async function getPastValorantMatches() {
  try {
    const { data } = await axiosInstance.get('valorant/matches/past', {
      params: { per_page: 50 }, // On récupère les 50 derniers matchs terminés
    });

    return data.map((match) => ({
      id: match.id,
      game: 'Valorant',
      team_a: {
        name: match.opponents[0]?.opponent.name || 'TBD',
        logo: match.opponents[0]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[0]?.opponent.id)?.score || 0,
      },
      team_b: {
        name: match.opponents[1]?.opponent.name || 'TBD',
        logo: match.opponents[1]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[1]?.opponent.id)?.score || 0,
      },
      winner: match.winner?.name || null, // Récupération du nom de l'équipe gagnante
      start_time: match.begin_at,
      status: match.status,
    }));
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des matchs passés :', error.message);
    throw new Error('Impossible de récupérer les matchs passés depuis PandaScore.');
  }
} 

// Récupérer les matchs VCT à venir pour Valorant
async function getUpcomingVctMatches() {
  try {
    const { data } = await axiosInstance.get('valorant/matches/upcoming');

    // Filtrer uniquement les matchs dont la ligue est VCT
    const vctMatches = data.filter(match => match.league?.name === "VCT").slice(0, 5); // 🔥 Filtrer dès le backend

    return vctMatches.map((match) => ({
      id: match.id,
      game: 'Valorant',
      team_a: {
        name: match.opponents[0]?.opponent.name || 'TBD',
        logo: match.opponents[0]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[0]?.opponent.id)?.score || 0,
      },
      team_b: {
        name: match.opponents[1]?.opponent.name || 'TBD',
        logo: match.opponents[1]?.opponent.image_url || null,
        score: match.results?.find((result) => result.team_id === match.opponents[1]?.opponent.id)?.score || 0,
      },
      serie: {
        name: match.serie?.name || 'Unknown Series',
        logo: match.league?.image_url || null,
      },
      start_time: match.begin_at,
      status: match.status,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs VCT :', error.message);
    throw new Error('Impossible de récupérer les matchs VCT à venir depuis PandaScore.');
  }
}


module.exports = {
  getUpcomingValorantMatches,
  getRunningValorantMatches,
  getPastValorantMatches,
  getTeamByName,
  getTeamStatsById,
  getTeams,
  getUpcomingVctMatches, // Ajout de la nouvelle fonction
};


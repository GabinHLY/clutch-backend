// teamController.js
import { getTeams, getTeamById, getTeamRoster } from '../application/teamService.js';

const getAllTeams = async (req, res) => {
  try {
    // Vous pouvez soit récupérer depuis la BDD soit forcer une synchronisation.
    // Ici, on récupère simplement les équipes de la BDD.
    const teams = await getTeams();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await getTeamById(id);
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRoster = async (req, res) => {
  try {
    const { id } = req.params;
    const roster = await getTeamRoster(id);
    res.json(roster);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getAllTeams, getTeam, getRoster };

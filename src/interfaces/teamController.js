import { getTeams, getTeamById, getTeamRoster } from '../application/teamService.js';

const getAllTeams = async (req, res) => {
    try {
        const game = req.query.game || 'valorant'; // Par défaut Valorant
        const teams = await getTeams(game);
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

// playerController.js
import { getPlayerById, getPlayersByTeam, syncPlayersByTeam } from '../application/playerService.js';

const getPlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const player = await getPlayerById(id);
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPlayers = async (req, res) => {
  try {
    const { teamId } = req.params;
    // Optionnel : vous pouvez synchroniser avant de récupérer
    // await syncPlayersByTeam(teamId);
    const players = await getPlayersByTeam(teamId);
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { getPlayer, getPlayers };

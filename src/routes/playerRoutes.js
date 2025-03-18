// playerRoutes.js
import express from 'express';
import { getPlayer, getPlayers } from '../interfaces/playerController.js';

const router = express.Router();

// Récupérer un joueur par son ID
router.get('/players/:id', getPlayer);

// Récupérer tous les joueurs d'une équipe (en passant l'ID de l'équipe dans l'URL)
router.get('/teams/:teamId/players', getPlayers);

export default router;

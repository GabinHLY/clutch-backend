const express = require("express");
const { getTeamData } = require("../controllers/teamController");
const router = express.Router();

router.get("/team/:slug", getTeamData);

module.exports = router;

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded; // On ajoute l'ID utilisateur dans `req.user`
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token invalide." });
    }
};

module.exports = authMiddleware;

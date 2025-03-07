import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // ✅ Récupération du token depuis les cookies

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ Stocke les infos utilisateur dans `req.user`
        console.log("Utilisateur authentifié :", decoded);
        next();
    } catch (error) {
        console.error("Erreur d'authentification :", error.message);
        return res.status(401).json({ error: "Token invalide." });
    }
};

export default authMiddleware;

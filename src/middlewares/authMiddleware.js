import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    // Lire le token depuis le cookie "token"
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔹 Payload décodé du token :", decoded);
        req.user = decoded; // par exemple { id: 13, iat: ..., exp: ... }
        next();
    } catch (error) {
        console.error("❌ Erreur JWT :", error.message);
        return res.status(401).json({ error: "Token invalide ou expiré." });
    }
};

export default authMiddleware;

import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization; // ✅ Récupération correcte du header en minuscule

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Accès refusé. Token manquant ou mal formaté." });
    }

    const token = authHeader.split(" ")[1]; // ✅ Séparation propre du token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // ✅ Stocke les infos utilisateur dans `req.user`
        console.log("Utilisateur authentifié :", decoded); // 🔍 Debug : Vérifie ce que contient le token
        next();
    } catch (error) {
        console.error("Erreur d'authentification :", error.message); // 🔍 Debug : Affiche pourquoi ça échoue
        return res.status(401).json({ error: "Token invalide." });
    }
};

export default authMiddleware;

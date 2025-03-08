import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    let token = req.cookies.token; // 🔥 Vérifie si le token est stocké en cookie

    if (!token && req.headers.cookie) {
        const cookies = req.headers.cookie.split("; ");
        const tokenCookie = cookies.find(c => c.startsWith("token="));
        if (tokenCookie) {
            token = tokenCookie.split("=")[1];
        }
    }

    console.log("🔹 Token extrait dans authMiddleware :", token); // ✅ Debug

    if (!token) {
        return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔹 Payload décodé du token :", decoded); // ✅ Debug

        req.user = decoded;
        next();
    } catch (error) {
        console.error("❌ Erreur JWT :", error.message);
        return res.status(401).json({ error: "Token invalide ou expiré." });
    }
};




export default authMiddleware;
  
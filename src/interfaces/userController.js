import UserService from '../application/userService.js';
import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import transporter from '../infrastructure/mailer.js';
import jwt from 'jsonwebtoken';

const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query("SELECT id, name, email, points, profile_picture, cover_photo, bio FROM users");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [user] = await db.query("SELECT id, name, email, points, profile_picture, cover_photo, bio FROM users WHERE id = ?", [id]);
        if (user.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé." });
        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await UserService.register(name, email, password);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier les identifiants via le service
        const user = await UserService.checkCredentials(email, password);

        // Génération du token JWT
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        console.log("🔹 ID utilisateur à stocker dans le token :", user.id);
        console.log("🔹 Token généré :", token);

        // Stocker le cookie "token" pour maintenir la session
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,      // true pour HTTPS
            sameSite: "none",  // autorise le cross-site
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 jours
        });
          
        res.status(200).json({
            message: "Connexion réussie",
            token,
            user
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const logout = async (req, res) => {
    try {
        // Suppression du cookie token
        res.cookie("token", "", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(0) // Date dans le passé pour supprimer immédiatement
        });
        
        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la déconnexion" });
    }
};

const getMe = async (req, res) => {
    try {
      console.log("🔹 ID utilisateur extrait du token :", req.user.id);
  
      // Ajoutez ici les colonnes souhaitées (points, profile_picture, etc.)
      const [rows] = await db.query(
        "SELECT id, name, email, points, profile_picture, cover_photo, bio FROM users WHERE id = ?",
        [req.user.id]
      );
  
      if (rows.length === 0) {
        return res.status(404).json({ error: "Utilisateur non trouvé." });
      }
  
      // Renvoie directement la première ligne trouvée
      res.json(rows[0]);
    } catch (error) {
      console.error("❌ Erreur serveur :", error);
      res.status(500).json({ error: "Erreur serveur." });
    }
};

const uploadProfilePicture = async (req, res) => {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: "Aucun fichier envoyé." });
    }
  
    const imageUrl = req.file.path; // ⚠️ c'est bien "imageUrl"
  
    try {
      await db.query(
        "UPDATE users SET profile_picture = ? WHERE id = ?",
        [imageUrl, req.user.id] // ✅ Correction ici
      );
  
      res.status(200).json({ 
        message: "Photo de profil mise à jour.", 
        profile_picture: imageUrl // ✅ Correction ici
      });
    } catch (error) {
      console.error("🛑 ERREUR UPLOAD PDP :", error);
      res.status(500).json({ error: "Erreur serveur.", details: error.message });
    }
  };
  

const updateProfile = async (req, res) => {
    try {
        const { name, bio } = req.body;
        await db.query("UPDATE users SET name = ?, bio = ? WHERE id = ?", [name, bio, req.user.id]);
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const [user] = await db.query("SELECT profile_picture FROM users WHERE id = ?", [req.user.id]);
        if (user.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }

        const profilePicture = user[0].profile_picture;
        await db.query("DELETE FROM users WHERE id = ?", [req.user.id]);

        if (profilePicture && profilePicture !== "default-profile.png" && fs.existsSync(path.join(process.cwd(), profilePicture))) {
            fs.unlinkSync(path.join(process.cwd(), profilePicture));
        }

        res.json({ message: "Compte supprimé avec succès." });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email requis." });

        const [user] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
        if (user.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé." });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 15 * 60 * 1000);
        await db.query("UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?", [resetToken, tokenExpiration, email]);

        const resetLink = `https://clutch.gabinduboc.fr/reset-password/confirm?token=${resetToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Réinitialisation du mot de passe",
            html: `<p>Cliquez sur le lien pour réinitialiser votre mot de passe : <a href="${resetLink}">${resetLink}</a></p>`
        });

        res.json({ message: "Email de réinitialisation envoyé." });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ error: "Token et nouveau mot de passe requis." });

        const [user] = await db.query("SELECT id FROM users WHERE reset_token = ? AND reset_token_expiration > NOW()", [token]);
        if (user.length === 0) return res.status(400).json({ error: "Token invalide ou expiré." });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?", [hashedPassword, user[0].id]);

        res.json({ message: "Mot de passe modifié avec succès." });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
};

export {
    register,
    login,
    logout,
    getMe,
    uploadProfilePicture,
    updateProfile,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
    getAllUsers,
    getUserById
};
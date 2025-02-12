const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require("../config/db"); // Connexion MySQL directe
const authMiddleware = require('../middlewares/authMiddleware');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "../uploads/");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

const upload = multer({ storage });

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Tous les champs sont requis." });
        }

        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length > 0) {
            return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: "Utilisateur créé avec succès" });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email et mot de passe requis." });
        }

        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect." });
        }

        const token = jwt.sign(
            { id: user[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: {
                id: user[0].id,
                name: user[0].name,
                email: user[0].email,
                points: user[0].points,
                profile_picture: user[0].profile_picture,
                cover_photo: user[0].cover_photo,
                bio: user[0].bio
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [user] = await db.query('SELECT id, name, email, points, profile_picture, cover_photo, bio FROM users WHERE id = ?', [req.user.id]);

        if (user.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        res.json(user[0]);

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, bio, profile_picture, cover_photo } = req.body;
        const [user] = await db.query('SELECT id FROM users WHERE id = ?', [req.user.id]);
        if (user.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        await db.query(
            'UPDATE users SET name = ?, bio = ?, profile_picture = ?, cover_photo = ? WHERE id = ?',
            [name || user[0].name, bio || user[0].bio, profile_picture || user[0].profile_picture, cover_photo || user[0].cover_photo, req.user.id]
        );

        res.json({ message: "Profil mis à jour avec succès." });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.post("/upload", authMiddleware, upload.single("profile_picture"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier uploadé." });
    }
    
    const imagePath = `uploads/${req.file.filename}`;
    
    try {
        const [user] = await db.query("SELECT profile_picture FROM users WHERE id = ?", [req.user.id]);
        if (user.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }
    
        const oldImagePath = user[0].profile_picture;
    
        await db.query("UPDATE users SET profile_picture = ? WHERE id = ?", [imagePath, req.user.id]);
    
        if (oldImagePath && oldImagePath !== "default-profile.png" && fs.existsSync(path.join(__dirname, "../", oldImagePath))) {
            fs.unlinkSync(path.join(__dirname, "../", oldImagePath));
        }
    
        res.status(200).json({ message: "Photo de profil mise à jour.", profile_picture: imagePath });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur." });
    }
});

router.patch('/password', authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "L'ancien et le nouveau mot de passe sont requis." });
        }

        const [user] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

        if (user.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        const isMatch = await bcrypt.compare(oldPassword, user[0].password);
        if (!isMatch) {
            return res.status(401).json({ error: "L'ancien mot de passe est incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: "Mot de passe modifié avec succès." });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "L'email est requis." });
        }

        const [user] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiration = new Date(Date.now() + 15 * 60 * 1000);

        await db.query('UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?', 
            [resetToken, tokenExpiration, email]);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Réinitialisation de votre mot de passe",
            html: `<p>Vous avez demandé une réinitialisation de mot de passe.</p>
                   <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe (valide 15 min) :</p>
                   <a href="${resetLink}">${resetLink}</a>`
        });

        res.json({ message: "Un email de réinitialisation a été envoyé." });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur", details: error.message });
    }
});

router.post('/reset-password/confirm', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: "Token et nouveau mot de passe requis." });
        }

        const [user] = await db.query('SELECT id FROM users WHERE reset_token = ? AND reset_token_expiration > NOW()', [token]);

        if (user.length === 0) {
            return res.status(400).json({ error: "Token invalide ou expiré." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?', 
            [hashedPassword, user[0].id]);

        res.json({ message: "Mot de passe modifié avec succès." });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;    
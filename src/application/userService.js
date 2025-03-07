import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class UserService {
    static async register(name, email, password) {
        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length > 0) throw new Error("Cet email est déjà utilisé.");

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        return { message: "Utilisateur créé avec succès" };
    }

    static async login(email, password) {
        const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) throw new Error("Email ou mot de passe incorrect.");

        const isMatch = await bcrypt.compare(password, user[0].password);
        if (!isMatch) throw new Error("Email ou mot de passe incorrect.");

        const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        return {
            message: "Connexion réussie",
            token,
            user: { id: user[0].id, name: user[0].name, email: user[0].email }
        };
    }
}

export default UserService;

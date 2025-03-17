import db from '../config/database.js';
import bcrypt from 'bcryptjs';

class UserService {
    static async register(name, email, password) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            throw new Error("Cet email est déjà utilisé.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        return { message: "Utilisateur créé avec succès" };
    }

    static async checkCredentials(email, password) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            throw new Error("Email ou mot de passe incorrect.");
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Email ou mot de passe incorrect.");
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email
        };
    }
}

export default UserService;

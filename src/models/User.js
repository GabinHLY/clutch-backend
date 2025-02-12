const db = require('../config/db');

class User {
  static findByEmail(email, callback) {
    db.query('SELECT * FROM users WHERE email = ?', [email], callback);
  }

  static create(user, callback) {
    db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      [user.name, user.email, user.password], callback);
  }

  static findById(id, callback) {
    db.query('SELECT id, name, email, points, profile_picture, cover_photo, bio FROM users WHERE id = ?', 
      [id], callback);
  }
}

module.exports = User;

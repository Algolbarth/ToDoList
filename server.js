import express, { json } from 'express';
import sqlite3 from 'sqlite3';
import jsonwebtoken from 'jsonwebtoken';
import cors from 'cors';

const app = express();
const PORT = 3000;
const SECRET_KEY = 'votre_cle_secrete';

app.use(json());
app.use(cors());

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        completed BOOLEAN DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!password || password.length < 8) {
        return res.status(400).json({ error: "Mot de passe trop court: 8 caractères minimum" });
    }

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Utilisateur créé avec succès!' });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'Identifiants incorrects' });
        
        const token = jsonwebtoken.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    });
});

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(403).json({ error: 'Accès refusé' });
    
    jsonwebtoken.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalide' });
        req.user = user;
        next();
    });
};

app.post('/tasks', authenticateToken, (req, res) => {
    const { title } = req.body;
    db.run('INSERT INTO tasks (user_id, title) VALUES (?, ?)', [req.user.userId, title], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, completed: false });
    });
});

app.get('/tasks', authenticateToken, (req, res) => {
    db.all('SELECT * FROM tasks WHERE user_id = ?', [req.user.userId], (err, tasks) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(tasks);
    });
});

app.delete("/tasks/:id", (req, res) => {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Accès non autorisé" });
    }

    db.run("DELETE FROM tasks WHERE id = ?", [id]);
    res.status(200).json({ message: "Tâche supprimée avec succès" });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3005;

// Turso Connection Check
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('CRITICAL: Turso Environment Variables are MISSING!');
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database Table
async function initDb() {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                url TEXT,
                icon TEXT,
                type TEXT DEFAULT 'link',
                image_url TEXT
            )
        `);
        console.log('Turso Database Initialized');
    } catch (err) {
        console.error('Database Init Error:', err);
    }
}
initDb();

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/links', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM links ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/links', async (req, res) => {
    const { title, url, icon, type, image_base64 } = req.body;
    try {
        await db.execute({
            sql: "INSERT INTO links (title, url, icon, type, image_url) VALUES (?, ?, ?, ?, ?)",
            args: [title, url, icon, type || 'link', image_base64 || null]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Route
const updateHandler = async (req, res) => {
    const id = req.params.id;
    const { title, url, icon, type, image_base64 } = req.body;
    try {
        if (image_base64) {
            await db.execute({
                sql: "UPDATE links SET title = ?, url = ?, icon = ?, type = ?, image_url = ? WHERE id = ?",
                args: [title, url, icon, type, image_base64, id]
            });
        } else {
            await db.execute({
                sql: "UPDATE links SET title = ?, url = ?, icon = ?, type = ? WHERE id = ?",
                args: [title, url, icon, type, id]
            });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

app.post('/api/links/:id', updateHandler);
app.put('/api/links/:id', updateHandler);

app.delete('/api/links/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await db.execute({
            sql: "DELETE FROM links WHERE id = ?",
            args: [id]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

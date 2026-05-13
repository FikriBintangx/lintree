const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3005;
const DB_PATH = path.join(__dirname, 'database.db');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static('public'));

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Initialize Database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('Error opening database', err);
    else initializeTables();
});

function initializeTables() {
    db.serialize(() => {
        // Links Table
        db.run(`CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            icon TEXT,
            type TEXT DEFAULT 'link',
            image_url TEXT,
            order_index INTEGER DEFAULT 0
        )`);

        // Check if image_url column exists (simple migration)
        db.all("PRAGMA table_info(links)", (err, rows) => {
            const hasImageUrl = rows.some(row => row.name === 'image_url');
            if (!hasImageUrl) {
                db.run("ALTER TABLE links ADD COLUMN image_url TEXT");
            }
        });
    });
}

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Test Route
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// API Routes
app.get('/api/links', (req, res) => {
    db.all("SELECT * FROM links ORDER BY order_index ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/links', upload.single('image'), (req, res) => {
    const { title, url, icon, type, order_index } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    db.run(
        "INSERT INTO links (title, url, icon, type, image_url, order_index) VALUES (?, ?, ?, ?, ?, ?)",
        [title, url, icon, type || 'link', image_url, order_index || 0],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, image_url });
        }
    );
});

app.get('/api/links/:id', (req, res) => {
    let id = req.params.id.replace(/\D/g, '');
    db.get("SELECT * FROM links WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    });
});

// Flexible route for updates (works with POST or PUT)
const updateHandler = (req, res) => {
    const { title, url, icon, type } = req.body;
    let rawId = req.params.id;
    
    let id = (rawId.match(/\d+/) || [rawId])[0];
    
    console.log(`[UPDATE] Request for ID: ${rawId} -> Cleaned: ${id}`);
    
    let query = "UPDATE links SET title = ?, url = ?, icon = ?, type = ? WHERE id = ?";
    let params = [title, url, icon, type, id];

    if (req.file) {
        query = "UPDATE links SET title = ?, url = ?, icon = ?, type = ?, image_url = ? WHERE id = ?";
        params = [title, url, icon, type, `/uploads/${req.file.filename}`, id];
    }

    db.run(query, params, function(err) {
        if (err) {
            console.error('Database Error:', err.message);
            return res.status(400).json({ error: err.message });
        }
        res.json({ success: true, changes: this.changes, id: id });
    });
};

app.post('/api/links/:id', upload.single('image'), updateHandler);
app.put('/api/links/:id', upload.single('image'), updateHandler);

app.delete('/api/links/:id', (req, res) => {
    const id = req.params.id.replace(/\D/g, '');
    db.run("DELETE FROM links WHERE id = ?", [id], function(err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

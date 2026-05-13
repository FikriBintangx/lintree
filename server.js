const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3005;

// Vercel compatibility: Use /tmp for DB if on Vercel
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const DB_FILE = isVercel ? '/tmp/db.json' : path.join(__dirname, 'db.json');

// Increase JSON limit for Base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read/write JSON "database"
function getDb() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = [
            { id: 1, title: "Instagram", url: "https://instagram.com/starr.co", icon: "instagram", type: "link" },
            { id: 2, title: "Our Portfolio", url: "https://portfolio.starr.co", icon: "arrow-right", type: "link" },
            { id: 3, title: "Web Design", url: "#", icon: "layout", type: "card" }
        ];
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/links', (req, res) => {
    res.json(getDb());
});

app.post('/api/links', (req, res) => {
    const { title, url, icon, type, image_base64 } = req.body;
    const db = getDb();
    const newLink = {
        id: Date.now(),
        title,
        url,
        icon,
        type: type || 'link',
        image_url: image_base64 || null
    };
    db.push(newLink);
    saveDb(db);
    res.json(newLink);
});

// Update Route
const updateHandler = (req, res) => {
    const id = parseInt(req.params.id);
    const { title, url, icon, type, image_base64 } = req.body;
    let db = getDb();
    const index = db.findIndex(l => l.id === id);

    if (index !== -1) {
        db[index] = {
            ...db[index],
            title,
            url,
            icon,
            type: type || db[index].type,
            image_url: image_base64 || db[index].image_url
        };
        saveDb(db);
        res.json(db[index]);
    } else {
        res.status(404).json({ error: 'Link not found' });
    }
};

app.post('/api/links/:id', updateHandler);
app.put('/api/links/:id', updateHandler);

app.delete('/api/links/:id', (req, res) => {
    const id = parseInt(req.params.id);
    let db = getDb();
    const filtered = db.filter(l => l.id !== id);
    saveDb(filtered);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

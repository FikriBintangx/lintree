const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3005;

// Vercel compatibility: Use /tmp for DB if on Vercel
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
const DB_FILE = isVercel ? '/tmp/db.json' : path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');

// Ensure uploads directory exists (local only)
if (!isVercel && !fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static('public'));

// Helper to read/write JSON "database"
function getDb() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = [
            { id: 1, title: "Instagram", url: "https://instagram.com/starr.co", icon: "instagram", type: "link" },
            { id: 2, title: "Our Portfolio", url: "https://portfolio.starr.co", icon: "arrow-right", type: "link" },
            { id: 3, title: "Web Design", url: "#", icon: "layout", type: "card", image_url: "/web_design.png" }
        ];
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
        return initialData;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function saveDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // On Vercel, we can't really store files permanently, but we'll try /tmp
        const dest = isVercel ? '/tmp' : UPLOADS_DIR;
        cb(null, dest);
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.get('/favicon.ico', (req, res) => res.status(204).end());

// API Routes
app.get('/api/links', (req, res) => {
    res.json(getDb());
});

app.post('/api/links', upload.single('image'), (req, res) => {
    const { title, url, icon, type } = req.body;
    const db = getDb();
    const newLink = {
        id: Date.now(),
        title,
        url,
        icon,
        type: type || 'link',
        image_url: req.file ? `/uploads/${req.file.filename}` : null
    };
    db.push(newLink);
    saveDb(db);
    res.json(newLink);
});

// Update Route (Supports POST and PUT)
const updateHandler = (req, res) => {
    const id = parseInt(req.params.id);
    const { title, url, icon, type } = req.body;
    let db = getDb();
    const index = db.findIndex(l => l.id === id);

    if (index !== -1) {
        db[index] = {
            ...db[index],
            title,
            url,
            icon,
            type: type || db[index].type,
            image_url: req.file ? `/uploads/${req.file.filename}` : db[index].image_url
        };
        saveDb(db);
        res.json(db[index]);
    } else {
        res.status(404).json({ error: 'Link not found' });
    }
};

app.post('/api/links/:id', upload.single('image'), updateHandler);
app.put('/api/links/:id', upload.single('image'), updateHandler);

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

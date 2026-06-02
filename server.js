require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3005;

const dataFile = path.join(__dirname, 'data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

function readData() {
    if (!fs.existsSync(dataFile)) {
        return [];
    }
    const raw = fs.readFileSync(dataFile);
    try {
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 4));
}

app.get('/api/links', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/links', (req, res) => {
    const { title, url, icon, type, image_base64 } = req.body;
    try {
        const data = readData();
        const newId = data.length > 0 ? Math.max(...data.map(d => parseInt(d.id) || 0)) + 1 : 1;
        const newLink = {
            id: newId.toString(),
            title, 
            url, 
            icon, 
            type: type || 'link', 
            image_url: image_base64 || null
        };
        data.push(newLink);
        writeData(data);
            
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const updateHandler = (req, res) => {
    const id = req.params.id;
    const { title, url, icon, type, image_base64 } = req.body;
    try {
        const data = readData();
        const index = data.findIndex(d => d.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], title, url, icon, type };
            if (image_base64) {
                data[index].image_url = image_base64;
            }
            writeData(data);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

app.post('/api/links/:id', updateHandler);
app.put('/api/links/:id', updateHandler);

app.delete('/api/links/:id', (req, res) => {
    const id = req.params.id;
    try {
        let data = readData();
        data = data.filter(d => d.id !== id);
        writeData(data);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3005;

// Supabase Connection Check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('CRITICAL: Supabase URL or Anon Key is MISSING!');
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Supabase REST API doesn't support CREATE TABLE directly
// The 'links' table must be created manually in Supabase SQL Editor
console.log('Using Supabase JS Client');

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/links', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('links')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/links', async (req, res) => {
    const { title, url, icon, type, image_base64 } = req.body;
    try {
        const { error } = await supabase
            .from('links')
            .insert([
                { title, url, icon, type: type || 'link', image_url: image_base64 || null }
            ]);
            
        if (error) throw error;
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
        const updateData = { title, url, icon, type };
        if (image_base64) {
            updateData.image_url = image_base64;
        }

        const { error } = await supabase
            .from('links')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
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
        const { error } = await supabase
            .from('links')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

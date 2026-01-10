// server.js (Final Working Version)
const express = require('express');
// We do NOT need require('node-fetch') because Node v22 has it built-in!
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!image) return res.status(400).send("No image provided");
        if (!API_KEY) return res.status(500).send("Server missing API Key");

        // 1. Direct URL to Google (Forces the correct v1beta version)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // 2. Construct the specific JSON Google expects
        const payload = {
            contents: [{
                parts: [
                    { text: "Act as an empathetic community aid worker. Analyze the person in this image. Estimate their likely age group, emotional state (tired? stressed? happy?), and any visible needs (are they wearing warm clothes?). Based on this visual analysis and a hypothetical cold rainy day, suggest 2 distinct aid items (e.g., food, clothing, medical). Format as HTML bullets." },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: image
                        }
                    }
                ]
            }]
        };

        // 3. Send the request using Native Node Fetch
        const googleRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await googleRes.json();

        // 4. Handle Errors from Google
        if (!googleRes.ok) {
            console.error("Google API Error:", JSON.stringify(data, null, 2));
            return res.status(500).send(`AI Error: ${data.error?.message || "Unknown"}`);
        }

        // 5. Extract the text response
        const text = data.candidates[0].content.parts[0].text;
        res.send(text);

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

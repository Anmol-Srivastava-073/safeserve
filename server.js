// server.js
const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (for the image data)
app.use(express.json({ limit: '10mb' }));

// Serve static files (HTML, CSS, Models) from the 'public' folder
app.use(express.static('public'));

// Initialize Gemini
// This will fail safely if the key is missing during build, but works at runtime
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// The API Endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).send("No image provided");
        }

        const prompt = "Act as an empathetic community aid worker. Analyze the person in this image. Estimate their likely age group, emotional state (tired? stressed? happy?), and any visible needs (are they wearing warm clothes?). Based on this visual analysis and a hypothetical cold rainy day, suggest 2 distinct aid items (e.g., food, clothing, medical). Format as HTML bullets.";

        const imagePart = {
            inlineData: {
                data: image,
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        res.send(text);

    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).send("Error analyzing image.");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { OpenAI } = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simulación de /generate usando OpenAI DALL·E
app.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt requerido' });

    // Generar imagen
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url'
    });

    const imageUrl = response.data[0].url;

    // Subir imagen a Cloudinary
    const uploaded = await cloudinary.uploader.upload(imageUrl, {
      format: 'png'
    });

    res.json({ image_url: uploaded.secure_url });
  } catch (error) {
    console.error('Error al generar o subir imagen:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al generar o subir imagen' });
  }
});

// Simulaciones vacías para reframe/remix
app.post('/reframe', (req, res) => {
  res.json({ message: 'Reframe simulado con éxito (fingiendo)' });
});

app.post('/remix', (req, res) => {
  res.json({ message: 'Remix simulado con éxito (fingiendo)' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


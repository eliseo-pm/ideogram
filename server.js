require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { v2: cloudinary } = require('cloudinary');

const app = express();
app.use(express.json());

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Ruta para generar imagen con Ideogram
app.post('/generate', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await axios.post('https://api.ideogram.ai/generate', {
      prompt: prompt
    });

    const imageUrl = response.data.image_url;

    // Subir a Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(imageUrl, {
      format: 'png'
    });

    res.json({ url: uploadedImage.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar o subir la imagen' });
  }
});
// Ruta para reframe
app.post('/reframe', async (req, res) => {
  try {
    const { image_url, prompt } = req.body;

    const response = await axios.post('https://api.ideogram.ai/reframe', {
      image_url,
      prompt
    });

    const resultImage = response.data.image_url;

    const uploadedImage = await cloudinary.uploader.upload(resultImage, {
      format: 'png'
    });

    res.json({ url: uploadedImage.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en /reframe' });
  }
});

// Ruta para remix
app.post('/remix', async (req, res) => {
  try {
    const { image_url, prompt } = req.body;

    const response = await axios.post('https://api.ideogram.ai/remix', {
      image_url,
      prompt
    });

    const resultImage = response.data.image_url;

    const uploadedImage = await cloudinary.uploader.upload(resultImage, {
      format: 'png'
    });

    res.json({ url: uploadedImage.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en /remix' });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));


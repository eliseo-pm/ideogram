import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import cloudinary from 'cloudinary';
import fs from 'fs';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configura Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.post('/generate', async (req, res) => {
  const { prompt, size } = req.body;

  try {
    const response = await openai.images.generate({
      prompt,
      model: "dall-e-3",
      size: size || "1024x1024",
      response_format: "url"
    });

    const imageUrl = response.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.buffer();
    const tmpFile = './temp.png';

    fs.writeFileSync(tmpFile, buffer);

    // Subir a Cloudinary
    const cloudinaryResult = await cloudinary.v2.uploader.upload(tmpFile, {
      folder: 'ideogram_fake',
      format: 'png',
    });

    fs.unlinkSync(tmpFile); // Borrar archivo temporal

    res.json({ image_url: cloudinaryResult.secure_url });
  } catch (err) {
    console.error('Error al generar o subir la imagen', err);
    res.status(500).json({ error: 'Error al generar o subir la imagen' });
  }
});

app.listen(8080, () => {
  console.log('🚀 Servidor corriendo en el puerto 8080');
});


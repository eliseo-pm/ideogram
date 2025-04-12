import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Configuration, OpenAIApi } from 'openai';
import https from 'https';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// Configuración de OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ruta principal de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando y esperando prompts 🧠');
});

// Ruta para generar imágenes y subirlas a Cloudinary
app.post('/generate', async (req, res) => {
  const { prompt, size } = req.body;

  if (!prompt || !size) {
    return res.status(400).json({ error: 'Faltan campos requeridos: prompt o size' });
  }

  try {
    // 1. Generar imagen con OpenAI
    const response = await openai.createImage({
      prompt,
      n: 1,
      size,
      response_format: 'url',
    });

    const imageUrl = response.data.data[0].url;
    const filename = `image-${Date.now()}.png`;
    const filepath = path.join('/tmp', filename); // usa /tmp porque Railway permite escritura ahí

    // 2. Descargar imagen temporalmente
    const downloadImage = (url, dest) =>
      new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (res) => {
          if (res.statusCode !== 200) return reject(new Error('Fallo al descargar imagen'));
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      });

    await downloadImage(imageUrl, filepath);

    // 3. Subir a Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(filepath, {
      folder: 'ideogram-clone',
    });

    // 4. Eliminar archivo temporal
    fs.unlinkSync(filepath);

    // 5. Enviar URL final
    res.json({ imageUrl: cloudinaryResult.secure_url });
  } catch (err) {
    console.error('❌ Error al generar o subir imagen:', err);
    res.status(500).json({ error: 'Error al generar o subir la imagen' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


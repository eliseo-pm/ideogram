const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.post('/generate', async (req, res) => {
  const { prompt, size } = req.body;
  if (!prompt || !size) {
    return res.status(400).json({ error: 'Falta prompt o tamaño' });
  }

  try {
    // Crear imagen usando OpenAI (DALL·E)
    const response = await openai.createImage({
      prompt,
      n: 1,
      size, // Por ejemplo "1024x1024"
      response_format: 'url'
    });

    // Ajusta según la estructura de respuesta actual:
    const imageUrl = response.data.data[0].url;
    const fileName = `image_${Date.now()}.png`;
    const filePath = path.join(__dirname, fileName);
    const file = fs.createWriteStream(filePath);

    // Descarga la imagen
    https.get(imageUrl, (downloadRes) => {
      downloadRes.pipe(file);
      file.on('finish', () => {
        file.close(async () => {
          try {
            // Sube la imagen a Cloudinary
            const cloudinaryRes = await cloudinary.uploader.upload(filePath, {
              folder: 'ideogram',
              resource_type: 'image',
              format: 'png'
            });

            // Borra el archivo temporal
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Error al borrar el archivo temporal:', unlinkErr);
              }
            });
            res.json({ image_url: cloudinaryRes.secure_url });
          } catch (uploadError) {
            console.error('Error subiendo a Cloudinary:', uploadError);
            res.status(500).json({ error: 'Error al subir imagen a Cloudinary' });
          }
        });
      });
    }).on('error', (downloadError) => {
      console.error('Error descargando la imagen:', downloadError);
      res.status(500).json({ error: 'Error al descargar la imagen generada' });
    });
  } catch (err) {
    console.error('Error generando la imagen:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Error al generar o subir la imagen' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


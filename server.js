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

  try {
    const response = await openai.createImage({
      prompt,
      n: 1,
      size,
      response_format: 'url'
    });

    const imageUrl = response.data.data[0].url;
    const fileName = `image_${Date.now()}.png`;
    const filePath = path.join(__dirname, fileName);
    const file = fs.createWriteStream(filePath);

    https.get(imageUrl, (response) => {
      response.pipe(file);
      file.on('finish', async () => {
        file.close();
        try {
          const cloudinaryRes = await cloudinary.uploader.upload(filePath, {
            folder: 'ideogram',
            resource_type: 'image',
            format: 'png',
          });

          fs.unlinkSync(filePath); // Borra archivo local
          res.json({ image_url: cloudinaryRes.secure_url });
        } catch (err) {
          console.error('Error subiendo a Cloudinary:', err.message);
          res.status(500).json({ error: 'Error al subir imagen' });
        }
      });
    });

  } catch (err) {
    console.error('Error generando imagen:', err.message);
    res.status(500).json({ error: 'Error al generar o subir la imagen' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


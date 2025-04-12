const express = require("express");
const multer = require("multer");
const { Configuration, OpenAIApi } = require("openai");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer();
const PORT = process.env.PORT || 8080;

// OpenAI setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint para generar imagen
app.post("/generate", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Generar imagen con OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data.data[0].url;

    // Descargar la imagen
    const imageResponse = await fetch(imageUrl);
    const buffer = await imageResponse.arrayBuffer();
    const imagePath = path.join(__dirname, "image.png");
    fs.writeFileSync(imagePath, Buffer.from(buffer));

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "ideogram-clone",
      format: "png",
    });

    fs.unlinkSync(imagePath); // eliminar temporal

    res.json({ imageUrl: result.secure_url });
  } catch (err) {
    console.error("Error al generar o subir la imagen:", err);
    res.status(500).json({ error: "Ocurrió un error 😢" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});


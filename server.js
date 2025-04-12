const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('¡Hola, el servidor funciona correctamente!');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
app.get('/test-env', (req, res) => {
  res.json({ openaiKey: process.env.OPENAI_API_KEY ? 'La clave está configurada' : 'La clave NO está configurada' });
});
app.post('/generate', async (req, res) => {
  const { prompt, size } = req.body;
  if (!prompt || !size) {
    return res.status(400).json({ error: 'Falta prompt o tamaño' });
  }
  try {
    const response = await openai.createImage({
      prompt,
      n: 1,
      size, // ej: "1024x1024"
      response_format: 'url'
    });
    // Registra toda la respuesta para ver su estructura
    console.log('Respuesta de OpenAI:', response.data);
    res.json({ message: 'Llamada a OpenAI exitosa', data: response.data });
  } catch (err) {
    console.error('Error en la llamada a OpenAI:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Error en la llamada a OpenAI' });
  }
});


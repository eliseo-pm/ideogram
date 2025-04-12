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

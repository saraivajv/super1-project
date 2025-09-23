import 'dotenv/config';
import express from 'express';

const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!',
             database: `Connecting to ${process.env.DB_HOST}`,
             cache: `Connecting to ${process.env.CACHE_HOST}`,
             search: `Connecting to ${process.env.ELASTICSEARCH_HOST}`
  });
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
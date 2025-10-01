import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Base de dados conectada com sucesso!');
});

// Exportamos uma função 'query' para ser usada em todo o aplicativo.
export const query = (text, params) => pool.query(text, params);

export default pool;

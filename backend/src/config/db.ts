import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT     || '3306'),
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'pharmastock',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:          'Z',
});

export const testConnection = async (): Promise<void> => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connecté avec succès');
    conn.release();
  } catch (error) {
    console.error('❌ Erreur connexion MySQL :', error);
    process.exit(1);
  }
};

const bcrypt = require('bcrypt');
const mysql  = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  const pool = await mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'pharmastock',
  });

  // 1. Voir ce qu'il y a actuellement en base
  const [avant] = await pool.query(
    'SELECT id_pharmacien, nom, email, LEFT(mot_de_passe, 20) AS hash_debut FROM pharmacien'
  );
  console.log('AVANT :', avant);

  // 2. Générer un vrai hash et mettre à jour
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query('UPDATE pharmacien SET mot_de_passe = ?', [hash]);
  console.log('✅ Hash mis à jour pour tous les pharmaciens');
  console.log('Nouveau hash :', hash);

  // 3. Vérifier
  const valid = await bcrypt.compare('admin123', hash);
  console.log('✅ Vérification bcrypt :', valid ? 'OK' : 'ECHEC');

  process.exit(0);
}

fix().catch(console.error);
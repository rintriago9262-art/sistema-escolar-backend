import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  // Solo cambiamos el texto de abajo
  connectionString: "postgresql://postgres.dfbauodpmwggqtbtlivi:d72XiMsKSwapU0KP@aws-1-us-east-1.pooler.supabase.com:6543/postgres",
  ssl: {
    rejectUnauthorized: false 
  }
});

// Esto es lo que nos dirá si funcionó en la terminal
pool.query('SELECT NOW()')
  .then(res => console.log('✅ Conexión exitosa a Supabase:', res.rows[0]))
  .catch(err => console.error('❌ Error de conexión:', err.message));
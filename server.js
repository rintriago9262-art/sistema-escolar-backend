//server.js
import express from "express";
import cors from "cors";
import { pool } from "./db.js";

const app = express();

// Configuración de CORS para permitir tu frontend de Vercel
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://sistema-escolar-frontend-tau.vercel.app'  // ← Tu URL de Vercel
  ],
  credentials: true
}));

app.use(express.json());

// =====================
// LOGIN
// =====================
app.post("/login", async (req, res) => {
  try {
    const { cedula, clave } = req.body;
    const query = "SELECT * FROM usuarios WHERE cedula = $1 AND clave = $2";
    const result = await pool.query(query, [cedula, clave]);

    if (result.rows.length === 0) {
      return res.status(401).json({ msg: "Cédula o contraseña incorrecta" });
    }

    const usuario = result.rows[0];
    delete usuario.clave; 
    
    res.json({ msg: "Bienvenido", usuario });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================
// GESTIÓN DE USUARIOS
// =====================
app.post("/usuarios", async (req, res) => {
  try {
    const { cedula, nombre, clave } = req.body;
    if (!cedula || !nombre || !clave) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }
    const query = `INSERT INTO usuarios (cedula, nombre, clave) VALUES ($1, $2, $3) RETURNING *;`;
    const result = await pool.query(query, [cedula, nombre, clave]);
    res.json({ msg: "Usuario registrado", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, nombre, clave } = req.body;
    const query = "UPDATE usuarios SET cedula=$1, nombre=$2, clave=$3 WHERE id=$4 RETURNING *";
    const result = await pool.query(query, [cedula, nombre, clave, id]);
    res.json({ msg: "Usuario actualizado", usuario: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    res.json({ msg: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GESTIÓN DE MATERIAS (ASIGNATURA)
// ==========================================
app.post("/materias", async (req, res) => {
  try {
    const { codigo, nombre, creditos } = req.body;
    const query = `INSERT INTO asignatura (codigo, nombre, creditos) VALUES ($1, $2, $3) RETURNING *;`;
    const result = await pool.query(query, [codigo, nombre, creditos]);
    res.json({ msg: "Materia agregada", materia: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/materias", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM asignatura ORDER BY nombre ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/materias/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, creditos } = req.body;
    const query = "UPDATE asignatura SET nombre=$1, creditos=$2 WHERE codigo=$3 RETURNING *";
    const result = await pool.query(query, [nombre, creditos, codigo]);
    res.json({ msg: "Materia actualizada", materia: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/materias/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    await pool.query("DELETE FROM asignatura WHERE codigo = $1", [codigo]);
    res.json({ msg: "Materia eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GESTIÓN DE ESTUDIANTES
// ==========================================
app.get("/estudiantes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM estudiantes ORDER BY apellido ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/estudiantes", async (req, res) => {
  try {
    const { cedula, nombre, apellido } = req.body;
    if (!cedula || !nombre || !apellido) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }
    const query = `INSERT INTO estudiantes (cedula, nombre, apellido) VALUES ($1, $2, $3) RETURNING *;`;
    const result = await pool.query(query, [cedula, nombre, apellido]);
    res.json({ msg: "Estudiante creado", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/estudiantes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cedula, nombre, apellido } = req.body;
    const query = "UPDATE estudiantes SET cedula=$1, nombre=$2, apellido=$3 WHERE id=$4 RETURNING *";
    const result = await pool.query(query, [cedula, nombre, apellido, id]);
    res.json({ msg: "Estudiante actualizado", estudiante: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/estudiantes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM estudiantes WHERE id = $1", [req.params.id]);
    res.json({ msg: "Estudiante eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GESTIÓN DE NOTAS
// ==========================================

// Obtener notas con nombres de estudiante y materia cruzados (JOIN)
app.get("/notas-detalle", async (req, res) => {
  try {
    const query = `
      SELECT n.id, 
             e.nombre || ' ' || e.apellido as estudiante, 
             a.nombre as materia, 
             n.calificacion, 
             n.observacion
      FROM notas n
      JOIN estudiantes e ON n.estudiante_id = e.id
      JOIN asignatura a ON n.materia_codigo = a.codigo
      ORDER BY n.id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una nota específica por ID (para editar)
app.get("/notas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM notas WHERE id = $1";
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Nota no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/notas", async (req, res) => {
  try {
    const { estudiante_id, materia_codigo, calificacion, observacion } = req.body;
    
    if (!estudiante_id || !materia_codigo || calificacion === undefined) {
      return res.status(400).json({ msg: "Estudiante, materia y calificación son obligatorios" });
    }
    
    const query = `INSERT INTO notas (estudiante_id, materia_codigo, calificacion, observacion) 
                   VALUES ($1, $2, $3, $4) RETURNING *;`;
    const result = await pool.query(query, [estudiante_id, materia_codigo, calificacion, observacion || null]);
    res.json({ msg: "Nota registrada", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/notas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estudiante_id, materia_codigo, calificacion, observacion } = req.body;
    
    const query = `UPDATE notas 
                   SET estudiante_id=$1, materia_codigo=$2, calificacion=$3, observacion=$4 
                   WHERE id=$5 RETURNING *`;
    const result = await pool.query(query, [estudiante_id, materia_codigo, calificacion, observacion || null, id]);
    
    res.json({ msg: "Nota actualizada", nota: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/notas/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM notas WHERE id = $1", [req.params.id]);
    res.json({ msg: "Nota eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SERVIDOR
app.listen(4000, () => console.log("Servidor corriendo en http://localhost:4000"));
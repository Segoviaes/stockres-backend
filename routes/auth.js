const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../db');

const router = express.Router();

// SIGNUP - Registrar residencia nueva
router.post('/signup', async (req, res) => {
  try {
    const { email, password, nombreResidencia } = req.body;

    if (!email || !password || !nombreResidencia) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Crear registro en tabla 'residencias'
    const { data: residencia, error: dbError } = await supabase
      .from('residencias')
      .insert([{
        id: authUser.user.id,
        email,
        nombre: nombreResidencia,
        creado_en: new Date()
      }])
      .select();

    if (dbError) {
      return res.status(400).json({ error: dbError.message });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: authUser.user.id, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'Residencia registrada',
      token,
      user: { id: authUser.user.id, email, nombreResidencia }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Autenticar con Supabase
    const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Obtener datos residencia
    const { data: residencia } = await supabase
      .from('residencias')
      .select('*')
      .eq('id', user.id)
      .single();

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombreResidencia: residencia?.nombre
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware para verificar JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = router;
module.exports.verificarToken = verificarToken;

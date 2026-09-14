const express = require('express');
const { supabase } = require('../db');
const { verificarToken } = require('./auth');

const router = express.Router();

// GET - Obtener todos los productos del usuario
router.get('/', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('residencia_id', req.user.id)
      .order('nombre', { ascending: true });

    if (error) throw error;

    res.json({ productos: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener un producto específico
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', req.params.id)
      .eq('residencia_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({ producto: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo producto
router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, sku, categoria, stock, minimo, costo, ubicacion } = req.body;

    if (!nombre || !sku) {
      return res.status(400).json({ error: 'Nombre y SKU requeridos' });
    }

    const { data, error } = await supabase
      .from('productos')
      .insert([{
        residencia_id: req.user.id,
        nombre,
        sku,
        categoria,
        stock: stock || 0,
        minimo: minimo || 10,
        costo: costo || 0,
        ubicacion: ubicacion || 'Almacén',
        creado_en: new Date()
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ mensaje: 'Producto creado', producto: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Editar producto
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { nombre, minimo, costo, ubicacion } = req.body;

    const { data, error } = await supabase
      .from('productos')
      .update({
        nombre,
        minimo,
        costo,
        ubicacion,
        actualizado_en: new Date()
      })
      .eq('id', req.params.id)
      .eq('residencia_id', req.user.id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    res.json({ mensaje: 'Producto actualizado', producto: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminar producto
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', req.params.id)
      .eq('residencia_id', req.user.id);

    if (error) throw error;

    res.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

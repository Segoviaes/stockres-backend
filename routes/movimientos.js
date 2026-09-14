const express = require('express');
const { supabase } = require('../db');
const { verificarToken } = require('./auth');

const router = express.Router();

// POST - Registrar movimiento (entrada/salida)
router.post('/', verificarToken, async (req, res) => {
  try {
    const { producto_id, tipo, cantidad, lote, motivo } = req.body;

    if (!producto_id || !tipo || !cantidad) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    if (!['entrada', 'salida'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo debe ser entrada o salida' });
    }

    // Obtener producto actual
    const { data: producto, error: prodError } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', producto_id)
      .eq('residencia_id', req.user.id)
      .single();

    if (prodError || !producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Calcular nuevo stock
    const nuevoStock = tipo === 'entrada' 
      ? producto.stock + cantidad 
      : Math.max(0, producto.stock - cantidad);

    // Registrar movimiento
    const { data: movimiento, error: movError } = await supabase
      .from('movimientos')
      .insert([{
        residencia_id: req.user.id,
        producto_id,
        tipo,
        cantidad,
        lote,
        motivo,
        stock_anterior: producto.stock,
        stock_nuevo: nuevoStock,
        creado_en: new Date()
      }])
      .select();

    if (movError) throw movError;

    // Actualizar stock del producto
    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock: nuevoStock, actualizado_en: new Date() })
      .eq('id', producto_id);

    if (updateError) throw updateError;

    res.status(201).json({
      mensaje: 'Movimiento registrado',
      movimiento: movimiento[0],
      nuevoStock
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Obtener historial de movimientos
router.get('/', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movimientos')
      .select(`
        *,
        productos:producto_id(nombre, sku)
      `)
      .eq('residencia_id', req.user.id)
      .order('creado_en', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ movimientos: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Historial de un producto específico
router.get('/producto/:producto_id', verificarToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*')
      .eq('producto_id', req.params.producto_id)
      .eq('residencia_id', req.user.id)
      .order('creado_en', { ascending: false });

    if (error) throw error;

    res.json({ historial: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

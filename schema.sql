-- TABLA: residencias (una por cliente SaaS)
CREATE TABLE residencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- TABLA: productos (pertenecen a una residencia)
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  categoria VARCHAR(100),
  stock INTEGER DEFAULT 0,
  minimo INTEGER DEFAULT 10,
  costo DECIMAL(10, 2) DEFAULT 0,
  ubicacion VARCHAR(100),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  UNIQUE(residencia_id, sku)
);

-- TABLA: movimientos (historial de entrada/salida)
CREATE TABLE movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
  cantidad INTEGER NOT NULL,
  lote VARCHAR(100),
  motivo VARCHAR(500),
  stock_anterior INTEGER,
  stock_nuevo INTEGER,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- TABLA: pedidos (compras a proveedores)
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  numero_pedido INTEGER,
  proveedor VARCHAR(255),
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado', 'recibido')),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW()
);

-- TABLA: lineas_pedido (artículos en cada pedido)
CREATE TABLE lineas_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- TABLA: inventario_fisico (conteos)
CREATE TABLE inventario_fisico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residencia_id UUID NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  contado INTEGER,
  diferencia INTEGER,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ÍNDICES para optimizar búsquedas
CREATE INDEX idx_productos_residencia ON productos(residencia_id);
CREATE INDEX idx_movimientos_residencia ON movimientos(residencia_id);
CREATE INDEX idx_movimientos_producto ON movimientos(producto_id);
CREATE INDEX idx_pedidos_residencia ON pedidos(residencia_id);
CREATE INDEX idx_lineas_pedido_pedido ON lineas_pedido(pedido_id);

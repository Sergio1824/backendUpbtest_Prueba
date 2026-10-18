CREATE TABLE IF NOT EXISTS productos (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    precio     NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock      INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compras (
    id              SERIAL PRIMARY KEY,
    total_unidades  INTEGER NOT NULL CHECK (total_unidades > 0),
    subtotal        NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    total           NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compra_detalles (
    id                SERIAL PRIMARY KEY,
    compra_id         INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    producto_id       INTEGER NOT NULL,
    nombre_producto   VARCHAR(100) NOT NULL,
    cantidad          INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario   NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal          NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS compra_detalles_compra_id_idx ON compra_detalles(compra_id);

INSERT INTO productos (nombre, precio, stock)
SELECT 'Cuaderno UPB', 18.50, 30
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Cuaderno UPB');

INSERT INTO productos (nombre, precio, stock)
SELECT 'Botella reutilizable', 32.00, 18
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Botella reutilizable');

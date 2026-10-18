const pool = require('../config/db');
const HttpError = require('../utils/http-error');

const aDinero = (centavos) => (centavos / 100).toFixed(2);

const crear = async (items) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ids = items.map((item) => item.productoId);
        const { rows } = await client.query(
            'SELECT id, nombre, precio, stock FROM productos WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE',
            [ids]
        );
        const productos = new Map(rows.map((producto) => [producto.id, producto]));

        const detalles = items.map((item) => {
            const producto = productos.get(item.productoId);
            if (!producto) throw new HttpError(404, `No existe el producto ${item.productoId}`);
            if (producto.stock < item.cantidad) {
                throw new HttpError(409, `Stock insuficiente para ${producto.nombre}; disponible: ${producto.stock}`);
            }

            const precioCentavos = Math.round(Number(producto.precio) * 100);
            const subtotalCentavos = precioCentavos * item.cantidad;
            return {
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: item.cantidad,
                precioCentavos,
                subtotalCentavos,
            };
        });

        const subtotalCentavos = detalles.reduce((total, item) => total + item.subtotalCentavos, 0);
        const totalUnidades = detalles.reduce((total, item) => total + item.cantidad, 0);
        const compraResult = await client.query(
            `INSERT INTO compras (total_unidades, subtotal, total)
             VALUES ($1, $2, $3)
             RETURNING id, created_at`,
            [totalUnidades, aDinero(subtotalCentavos), aDinero(subtotalCentavos)]
        );
        const compra = compraResult.rows[0];

        for (const detalle of detalles) {
            await client.query(
                `INSERT INTO compra_detalles
                    (compra_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [compra.id, detalle.productoId, detalle.nombre, detalle.cantidad,
                    aDinero(detalle.precioCentavos), aDinero(detalle.subtotalCentavos)]
            );
            await client.query('UPDATE productos SET stock = stock - $1 WHERE id = $2', [detalle.cantidad, detalle.productoId]);
        }

        await client.query('COMMIT');
        return {
            id: compra.id,
            totalUnidades,
            subtotal: Number(aDinero(subtotalCentavos)),
            total: Number(aDinero(subtotalCentavos)),
            createdAt: compra.created_at,
            items: detalles.map((item) => ({
                productoId: item.productoId,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precioUnitario: Number(aDinero(item.precioCentavos)),
                subtotal: Number(aDinero(item.subtotalCentavos)),
            })),
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const findById = async (id) => {
    const compraResult = await pool.query(
        `SELECT id, total_unidades, subtotal, total, created_at
         FROM compras WHERE id = $1`,
        [id]
    );
    if (compraResult.rows.length === 0) return null;

    const compra = compraResult.rows[0];
    const detallesResult = await pool.query(
        `SELECT producto_id, nombre_producto, cantidad, precio_unitario, subtotal
         FROM compra_detalles WHERE compra_id = $1 ORDER BY id`,
        [id]
    );

    return {
        id: compra.id,
        totalUnidades: Number(compra.total_unidades),
        subtotal: Number(compra.subtotal),
        total: Number(compra.total),
        createdAt: compra.created_at,
        items: detallesResult.rows.map((item) => ({
            productoId: item.producto_id,
            nombre: item.nombre_producto,
            cantidad: Number(item.cantidad),
            precioUnitario: Number(item.precio_unitario),
            subtotal: Number(item.subtotal),
        })),
    };
};

module.exports = { crear, findById };

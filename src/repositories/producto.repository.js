const pool = require('../config/db');
const Producto = require('../entities/producto.entity');

const findAll = async () => {
    const { rows } = await pool.query('SELECT * FROM productos ORDER BY id');
    return rows.map(Producto.fromRow);
};

const findById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    return Producto.fromRow(rows[0]);
};

const findByIds = async (ids) => {
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = ANY($1::int[])', [ids]);
    return rows.map(Producto.fromRow);
};

const create = async ({ nombre, precio, stock }) => {
    const { rows } = await pool.query(
        `INSERT INTO productos (nombre, precio, stock)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [nombre, precio, stock]
    );
    return Producto.fromRow(rows[0]);
};

const update = async (id, { nombre, precio, stock }) => {
    const { rows } = await pool.query(
        `UPDATE productos
         SET nombre = $1, precio = $2, stock = $3
         WHERE id = $4
         RETURNING *`,
        [nombre, precio, stock, id]
    );
    return Producto.fromRow(rows[0]);
};

const remove = async (id) => {
    const { rowCount } = await pool.query('DELETE FROM productos WHERE id = $1', [id]);
    return rowCount > 0;
};

module.exports = { findAll, findById, findByIds, create, update, remove };

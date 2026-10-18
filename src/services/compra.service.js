const productoRepository = require('../repositories/producto.repository');
const compraRepository = require('../repositories/compra.repository');
const HttpError = require('../utils/http-error');

const validarItems = (items) => {
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
        throw new HttpError(400, 'Envía entre 1 y 50 productos en "items"');
    }

    const cantidades = new Map();
    for (const item of items) {
        if (!Number.isInteger(item?.productoId) || item.productoId <= 0) {
            throw new HttpError(400, 'Cada producto debe tener un "productoId" entero positivo');
        }
        if (!Number.isInteger(item?.cantidad) || item.cantidad <= 0 || item.cantidad > 999) {
            throw new HttpError(400, 'Cada cantidad debe ser un entero entre 1 y 999');
        }
        const cantidad = (cantidades.get(item.productoId) || 0) + item.cantidad;
        if (cantidad > 999) throw new HttpError(400, 'La cantidad máxima por producto es 999');
        cantidades.set(item.productoId, cantidad);
    }

    return [...cantidades].map(([productoId, cantidad]) => ({ productoId, cantidad }));
};

const dinero = (centavos) => Number((centavos / 100).toFixed(2));

const calcular = async (itemsSinValidar) => {
    const items = validarItems(itemsSinValidar);
    const productos = await productoRepository.findByIds(items.map((item) => item.productoId));
    const porId = new Map(productos.map((producto) => [producto.id, producto]));

    const detalle = items.map((item) => {
        const producto = porId.get(item.productoId);
        if (!producto) throw new HttpError(404, `No existe el producto ${item.productoId}`);
        if (item.cantidad > producto.stock) {
            throw new HttpError(409, `Stock insuficiente para ${producto.nombre}; disponible: ${producto.stock}`);
        }
        const precioCentavos = Math.round(producto.precio * 100);
        return {
            productoId: producto.id,
            nombre: producto.nombre,
            precioUnitario: dinero(precioCentavos),
            cantidad: item.cantidad,
            subtotal: dinero(precioCentavos * item.cantidad),
        };
    });

    const totalCentavos = detalle.reduce((suma, item) => suma + Math.round(item.subtotal * 100), 0);
    return {
        items: detalle,
        totalUnidades: detalle.reduce((suma, item) => suma + item.cantidad, 0),
        subtotal: dinero(totalCentavos),
        total: dinero(totalCentavos),
    };
};

const confirmar = async (items) => compraRepository.crear(validarItems(items));

const obtener = async (id) => {
    const numero = Number(id);
    if (!Number.isInteger(numero) || numero <= 0) throw new HttpError(400, 'El id debe ser un entero positivo');
    const compra = await compraRepository.findById(numero);
    if (!compra) throw new HttpError(404, 'Compra no encontrada');
    return compra;
};

module.exports = { calcular, confirmar, obtener };

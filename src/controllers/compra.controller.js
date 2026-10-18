const compraService = require('../services/compra.service');

const calcular = async (req, res) => {
    res.json(await compraService.calcular(req.body?.items));
};

const confirmar = async (req, res) => {
    res.status(201).json(await compraService.confirmar(req.body?.items));
};

const obtener = async (req, res) => {
    res.json(await compraService.obtener(req.params.id));
};

module.exports = { calcular, confirmar, obtener };

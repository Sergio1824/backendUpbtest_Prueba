const { Router } = require('express');
const compraController = require('../controllers/compra.controller');

const router = Router();

router.post('/calcular', compraController.calcular);

module.exports = router;

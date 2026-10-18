const { Router } = require('express');
const compraController = require('../controllers/compra.controller');

const router = Router();

router.post('/', compraController.confirmar);
router.get('/:id', compraController.obtener);

module.exports = router;

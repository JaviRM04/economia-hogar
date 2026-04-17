import { Router } from 'express';
import * as ctrl from './deudas.controller';
import { autenticar } from '../../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/balance', ctrl.balance);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.editarDeuda);
router.delete('/:id', ctrl.eliminarDeuda);
router.post('/:id/liquidar', ctrl.liquidar);
router.post('/:id/pago-parcial', ctrl.pagoParcial);

export default router;

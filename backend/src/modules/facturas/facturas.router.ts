import { Router } from 'express';
import * as ctrl from './facturas.controller';
import { autenticar } from '../../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/proximas', ctrl.proximasSemana);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.desactivar);
router.post('/:id/pagar', ctrl.pagar);

export default router;

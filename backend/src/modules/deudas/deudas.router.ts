import { Router } from 'express';
import * as ctrl from './deudas.controller';
import { autenticar } from '../../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/balance', ctrl.balance);
router.post('/', ctrl.crear);
router.post('/:id/liquidar', ctrl.liquidar);

export default router;

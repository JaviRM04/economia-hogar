import { Router } from 'express';
import * as ctrl from './metas.controller';
import { autenticar } from '../../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.post('/:id/aportar', ctrl.aportar);
router.patch('/:id/estado', ctrl.cambiarEstado);
router.delete('/:id', ctrl.eliminar);

export default router;

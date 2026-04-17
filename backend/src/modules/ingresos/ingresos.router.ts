import { Router } from 'express';
import * as ctrl from './ingresos.controller';
import { autenticar } from '../../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/resumen', ctrl.resumen);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

export default router;

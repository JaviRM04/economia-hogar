import { Router } from 'express';
import * as ctrl from './gastos.controller';
import { autenticar } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

router.use(autenticar);

router.get('/', ctrl.listar);
router.get('/resumen', ctrl.resumen);
router.get('/comparativa', ctrl.comparativa);
router.get('/sugerencias', ctrl.sugerencias);
router.get('/uploads/:filename', ctrl.ticket);
router.get('/:id', ctrl.obtener);
router.post('/', upload.single('ticket'), ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

export default router;

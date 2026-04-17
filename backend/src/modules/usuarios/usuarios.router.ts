import { Router } from 'express';
import * as ctrl from './usuarios.controller';
import { autenticar } from '../../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/presupuestos', ctrl.obtenerPresupuestos);
router.put('/presupuestos', ctrl.upsertPresupuesto);
router.delete('/presupuestos/:categoria', ctrl.eliminarPresupuesto);
router.get('/categorias', ctrl.obtenerCategorias);
router.post('/categorias', ctrl.crearCategoria);
router.delete('/categorias/:id', ctrl.eliminarCategoria);
router.get('/exportar', ctrl.exportar);

export default router;

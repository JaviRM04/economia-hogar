import { Router } from 'express';
import * as ctrl from './auth.controller';
import { autenticar } from '../../middleware/auth';

const router = Router();

router.post('/login', ctrl.login);
router.post('/registro', ctrl.registrar);
router.get('/perfil', autenticar, ctrl.perfil);
router.put('/perfil', autenticar, ctrl.actualizarPerfil);
router.put('/perfil/password', autenticar, ctrl.cambiarPassword);
router.get('/usuarios', autenticar, ctrl.listarUsuarios);

export default router;

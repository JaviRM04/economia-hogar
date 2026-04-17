import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombre = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, nombre);
  },
});

const filtroImagenes = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, HEIC)'));
  }
};

export const upload = multer({
  storage,
  fileFilter: filtroImagenes,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

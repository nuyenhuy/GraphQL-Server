import {Router} from 'express';
import {uploadController} from '../controllers/upload.controller.js';
import multer from 'multer';

const router: Router = Router();
const upload: multer.Multer = multer({dest: 'uploads/'});
router.post('/upload', upload.single('file'), uploadController.uploadFile);
export default router;

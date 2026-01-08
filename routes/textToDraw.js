import express from 'express';
import textToDraw from '../controllers/text-to-draw.js';

const router = express.Router();

router.post('/', textToDraw);
export default router;

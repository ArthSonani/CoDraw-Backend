import express from 'express';
import metrics from '../controllers/metrics.js';

const router = express.Router();

router.post('/', metrics);

export default router;

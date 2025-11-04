import express from 'express';
import {
  saveWhiteboard,
  uploadPreview,
  getWhiteboards,
  deleteWhiteboard,
  getWhiteboardById,
} from '../controllers/whiteboardController.js';
import { authenticateUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/save', authenticateUser, saveWhiteboard);
router.post('/upload-preview', uploadPreview);
router.get('/', authenticateUser, getWhiteboards);
router.delete('/:id', authenticateUser, deleteWhiteboard);
router.get('/:id', authenticateUser, getWhiteboardById);

export default router;

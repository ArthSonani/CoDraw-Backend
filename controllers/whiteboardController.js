import Whiteboard from '../models/whiteboard.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

export const saveWhiteboard = async (req, res) => {
  const { boardId, data, previewImage } = req.body;
  const userId = req.userId;

  if (!boardId || !data) {
    return res.status(400).json({ error: 'Board ID and data are required' });
  }

  try {
    let whiteboard = await Whiteboard.findOne({ _id: boardId, userId });

    if (whiteboard) {
      whiteboard.data = data;
      if (previewImage) whiteboard.previewImage = previewImage;
      await whiteboard.save();
    } else {
      whiteboard = new Whiteboard({ _id: boardId, userId, data, previewImage });
      await whiteboard.save();
    }

    res.status(201).json({ message: 'Whiteboard saved' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const uploadPreview = async (req, res) => {
  try {
    const image = req.body.image;
    if (!image) return res.status(400).json({ error: 'No image data provided' });

    const base64Data = image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'whiteboards', format: 'png' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary error:', error);
          return res.status(500).json({ error: 'Cloudinary error' });
        }
        return res.status(200).json({ url: result.secure_url });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
};

export const getWhiteboards = async (req, res) => {
  try {
    const whiteboards = await Whiteboard.find({ userId: req.userId });
    res.json(whiteboards);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWhiteboard = async (req, res) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id);

    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    if (whiteboard.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await whiteboard.deleteOne();
    res.status(200).json({ message: 'Whiteboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete whiteboard' });
  }
};

export const getWhiteboardById = async (req, res) => {
  try {
    const whiteboard = await Whiteboard.findById(req.params.id);
    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    if (whiteboard.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(whiteboard);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

export default {
  saveWhiteboard,
  uploadPreview,
  getWhiteboards,
  deleteWhiteboard,
  getWhiteboardById,
};

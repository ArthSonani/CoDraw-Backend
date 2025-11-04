import mongoose from 'mongoose';

const whiteboardSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  previewImage: {
    type: String,
    default: ''
  },
  createdAt: { type: Date, default: Date.now },
});

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);

export default Whiteboard;

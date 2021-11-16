import mongoose from 'mongoose';

const filesSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  subPath: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  strict: 'throw',
});

export default mongoose.model('Files', filesSchema);

import mongoose from 'mongoose';

const accessSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  file_id: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
}, {
  strict: 'throw',
});

export default mongoose.model('Access', accessSchema);

import mongoose from 'mongoose';

const piplineSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  runname: {
    type: String,
    required: true,
    unique: true,
  },
  url: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
  },
  run_id: {
    type: String,
    required: true,
  },
  servingUrl: {
    type: String,
  },
}, {
  strict: 'throw',
});

export default mongoose.model('Pipelines', piplineSchema);

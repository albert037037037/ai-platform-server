import mongoose from 'mongoose';

const usersSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  jupyterToken: {
    type: String,
  },
}, {
  strict: 'throw',
});

export default mongoose.model('Users', usersSchema);

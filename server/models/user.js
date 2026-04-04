import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'user' },
  online: { type: Boolean, default: false },
  last_seen: { type: Date, default: Date.now },
  google_id: { type: String },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
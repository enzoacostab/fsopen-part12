import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3
  },
  favorite_genre: {
    type: String
  }
})

export default mongoose.model('User', schema)
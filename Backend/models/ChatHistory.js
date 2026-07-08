import mongoose from 'mongoose';

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    sender: { type: String, enum: ['employee', 'hr', 'ai'], required: true },
    text: { type: String, required: true },
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

const ChatHistorySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    messages: [MessageSchema]
  },
  { timestamps: true }
);

export default mongoose.model('ChatHistory', ChatHistorySchema);

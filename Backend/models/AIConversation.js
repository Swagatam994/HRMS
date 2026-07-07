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

const AIConversationSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    messages: [MessageSchema]
  },
  { timestamps: true }
);

export default mongoose.model('AIConversation', AIConversationSchema);

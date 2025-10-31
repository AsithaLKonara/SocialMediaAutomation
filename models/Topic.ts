import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITopic extends Document {
  title: string;
  description?: string;
  status: 'pending' | 'generating' | 'generated' | 'posted';
  platforms?: string[]; // Selected platforms for this topic
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'generating', 'generated', 'posted'],
      default: 'pending',
    },
    platforms: {
      type: [String],
      enum: ['linkedin', 'facebook', 'instagram', 'x', 'tiktok'],
      default: ['linkedin', 'facebook', 'instagram', 'x'],
    },
  },
  {
    timestamps: true,
  }
);

const Topic: Model<ITopic> = mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema);

export default Topic;


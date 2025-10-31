import mongoose, { Schema, Document, Model } from 'mongoose';

export type Platform = 'linkedin' | 'facebook' | 'instagram' | 'x' | 'tiktok';

export interface IPost extends Document {
  topicId: mongoose.Types.ObjectId;
  platform: Platform;
  content: string;
  hashtags: string[];
  mediaUrl?: string;
  videoScript?: string; // For TikTok/Reels
  scheduledTime?: Date;
  postedAt?: Date;
  status: 'draft' | 'scheduled' | 'posted' | 'approved';
  // Platform-specific post IDs
  linkedInPostId?: string;
  facebookPostId?: string;
  instagramPostId?: string;
  xPostId?: string;
  tiktokPostId?: string;
  // Analytics
  views?: number;
  reactions?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  saves?: number; // Instagram/TikTok
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'Topic ID is required'],
    },
    platform: {
      type: String,
      enum: ['linkedin', 'facebook', 'instagram', 'x', 'tiktok'],
      required: [true, 'Platform is required'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    hashtags: {
      type: [String],
      default: [],
    },
    mediaUrl: {
      type: String,
    },
    videoScript: {
      type: String,
    },
    scheduledTime: {
      type: Date,
    },
    postedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'posted', 'approved'],
      default: 'draft',
    },
    // Platform-specific post IDs
    linkedInPostId: {
      type: String,
    },
    facebookPostId: {
      type: String,
    },
    instagramPostId: {
      type: String,
    },
    xPostId: {
      type: String,
    },
    tiktokPostId: {
      type: String,
    },
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    reactions: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    saves: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
PostSchema.index({ status: 1, scheduledTime: 1 });
PostSchema.index({ topicId: 1 });
PostSchema.index({ platform: 1, status: 1 });
PostSchema.index({ platform: 1, topicId: 1 });

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;


import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  name: string;
  category: string;
  demandLevel: 'high' | 'medium' | 'low';
  relatedCareers: string[];
  relatedSkills: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'programming',
        'framework',
        'database',
        'cloud',
        'devops',
        'data-science',
        'design',
        'soft-skill',
        'management',
        'testing',
        'security',
        'mobile',
        'ai-ml',
        'other',
      ],
    },
    demandLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    relatedCareers: [String],
    relatedSkills: [String],
    description: String,
  },
  {
    timestamps: true,
  }
);

skillSchema.index({ name: 'text', category: 1 });

export const Skill = mongoose.model<ISkill>('Skill', skillSchema);

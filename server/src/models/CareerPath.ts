import mongoose, { Schema, Document } from 'mongoose';

export interface ICareerPath extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  requiredSkills: string[];
  optionalSkills: string[];
  averageSalary: {
    min: number;
    max: number;
    currency: string;
  };
  demandLevel: 'high' | 'medium' | 'low';
  growthOutlook: string;
  learningResources: {
    title: string;
    url: string;
    type: 'course' | 'certification' | 'book' | 'tutorial' | 'bootcamp';
    provider: string;
    isFree: boolean;
  }[];
  roadmap: {
    phase: number;
    title: string;
    description: string;
    skills: string[];
    durationWeeks: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const careerPathSchema = new Schema<ICareerPath>(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    requiredSkills: [String],
    optionalSkills: [String],
    averageSalary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    demandLevel: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    growthOutlook: String,
    learningResources: [
      {
        title: String,
        url: String,
        type: {
          type: String,
          enum: ['course', 'certification', 'book', 'tutorial', 'bootcamp'],
        },
        provider: String,
        isFree: Boolean,
      },
    ],
    roadmap: [
      {
        phase: Number,
        title: String,
        description: String,
        skills: [String],
        durationWeeks: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

careerPathSchema.index({ title: 'text', category: 1 });

export const CareerPath = mongoose.model<ICareerPath>('CareerPath', careerPathSchema);

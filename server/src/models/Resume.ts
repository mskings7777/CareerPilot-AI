import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  originalFilename: string;
  filePath: string;
  fileType: 'pdf' | 'docx';
  rawText: string;
  parsed: {
    skills: string[];
    experience: {
      title: string;
      company: string;
      duration: string;
      description: string;
    }[];
    education: {
      degree: string;
      field: string;
      institution: string;
      year?: number;
    }[];
    certifications: string[];
    summary?: string;
  };
  isProcessed: boolean;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    rawText: {
      type: String,
      default: '',
    },
    parsed: {
      skills: [String],
      experience: [
        {
          title: String,
          company: String,
          duration: String,
          description: String,
        },
      ],
      education: [
        {
          degree: String,
          field: String,
          institution: String,
          year: Number,
        },
      ],
      certifications: [String],
      summary: String,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model<IResume>('Resume', resumeSchema);

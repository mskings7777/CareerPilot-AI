import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  careerPaths: {
    careerPathId: mongoose.Types.ObjectId;
    title: string;
    matchScore: number;
    skillFitScore: number;
    demandScore: number;
    growthScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    explanation: string;
    cosineSimilarity: number;
    factors: {
      factor: string;
      score: number;
      maxScore: number;
      weight: number;
      description: string;
    }[];
  }[];
  skillGap: {
    currentSkills: string[];
    requiredSkills: string[];
    missingSkills: string[];
    matchScore: number;
    gapPercentage: number;
    categoryBreakdown: {
      category: string;
      total: number;
      matched: number;
      missing: string[];
      proficiencyDistribution: {
        beginner: number;
        intermediate: number;
        advanced: number;
      };
    }[];
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    careerPaths: [
      {
        careerPathId: {
          type: Schema.Types.ObjectId,
          ref: 'CareerPath',
        },
        title: String,
        matchScore: {
          type: Number,
          min: 0,
          max: 100,
        },
        skillFitScore: Number,
        demandScore: Number,
        growthScore: Number,
        matchedSkills: [String],
        missingSkills: [String],
        explanation: String,
        cosineSimilarity: Number,
        factors: [
          {
            factor: String,
            score: Number,
            maxScore: Number,
            weight: Number,
            description: String,
          },
        ],
      },
    ],
    skillGap: {
      currentSkills: [String],
      requiredSkills: [String],
      missingSkills: [String],
      matchScore: Number,
      gapPercentage: Number,
      categoryBreakdown: [
        {
          category: String,
          total: Number,
          matched: Number,
          missing: [String],
          proficiencyDistribution: {
            beginner: Number,
            intermediate: Number,
            advanced: Number,
          },
        },
      ],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Recommendation = mongoose.model<IRecommendation>(
  'Recommendation',
  recommendationSchema
);

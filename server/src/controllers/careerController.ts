import { Response, NextFunction } from 'express';
import { Resume, Recommendation, CareerPath } from '../models';
import { AuthRequest, AppError } from '../middleware';
import { analyzeSkillGap, recommendCareers, generatePersonalizedRoadmap } from '../services';

/**
 * @route   POST /api/career/analyze/:resumeId
 * @desc    Analyze skill gap and generate career recommendations for a resume
 */
export const analyzeAndRecommend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user!._id,
    });

    if (!resume) {
      throw new AppError('Resume not found.', 404);
    }

    if (!resume.isProcessed || !resume.parsed.skills.length) {
      throw new AppError('Resume has not been processed yet or no skills were extracted.', 400);
    }

    const userSkills = resume.parsed.skills;

    // Run skill gap analysis and career recommendations in parallel
    const [skillGap, careerMatches] = await Promise.all([
      analyzeSkillGap(userSkills),
      recommendCareers(userSkills),
    ]);

    // Save recommendation with full enhanced data
    const recommendation = await Recommendation.create({
      userId: req.user!._id,
      resumeId: resume._id,
      careerPaths: careerMatches.map((match) => ({
        careerPathId: match.careerPath._id,
        title: match.careerPath.title,
        matchScore: match.matchScore,
        skillFitScore: match.skillFitScore,
        demandScore: match.demandScore,
        growthScore: match.growthScore,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        explanation: match.explanation,
        cosineSimilarity: match.cosineSimilarity,
        factors: match.factors,
      })),
      skillGap: {
        currentSkills: skillGap.currentSkills,
        requiredSkills: skillGap.requiredSkills,
        missingSkills: skillGap.missingSkills.map((s) => s.skill),
        matchScore: skillGap.matchScore,
        gapPercentage: skillGap.gapPercentage,
        categoryBreakdown: skillGap.categoryBreakdown,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: recommendation._id,
        skillGap: {
          currentSkills: skillGap.currentSkills,
          requiredSkills: skillGap.requiredSkills,
          matchedSkills: skillGap.matchedSkills,
          missingSkills: skillGap.missingSkills,
          matchScore: skillGap.matchScore,
          gapPercentage: skillGap.gapPercentage,
          categoryBreakdown: skillGap.categoryBreakdown,
        },
        careerRecommendations: careerMatches.map((match) => ({
          careerPath: {
            id: match.careerPath._id,
            title: match.careerPath.title,
            description: match.careerPath.description,
            demandLevel: match.careerPath.demandLevel,
            averageSalary: match.careerPath.averageSalary,
          },
          matchScore: match.matchScore,
          skillFitScore: match.skillFitScore,
          demandScore: match.demandScore,
          growthScore: match.growthScore,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
          explanation: match.explanation,
          factors: match.factors,
          cosineSimilarity: match.cosineSimilarity,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/career/recommendations
 * @desc    Get all recommendations for current user
 */
export const getRecommendations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recommendations = await Recommendation.find({
      userId: req.user!._id,
    })
      .sort({ createdAt: -1 })
      .populate('resumeId', 'originalFilename createdAt');

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/career/recommendations/:id
 * @desc    Get a single recommendation by ID
 */
export const getRecommendationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    }).populate('resumeId', 'originalFilename parsed.skills createdAt');

    if (!recommendation) {
      throw new AppError('Recommendation not found.', 404);
    }

    res.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/career/paths
 * @desc    Get all available career paths
 */
export const getCareerPaths = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const careers = await CareerPath.find()
      .select('title slug description category demandLevel averageSalary requiredSkills')
      .sort({ demandLevel: 1, title: 1 });

    res.json({
      success: true,
      data: careers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/career/paths/:slug
 * @desc    Get a career path by slug (with full roadmap)
 */
export const getCareerPathBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const career = await CareerPath.findOne({ slug: req.params.slug });

    if (!career) {
      throw new AppError('Career path not found.', 404);
    }

    res.json({
      success: true,
      data: career,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/career/skill-gap/:resumeId
 * @desc    Get skill gap analysis for a resume against a specific career
 */
export const getSkillGapForCareer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resumeId } = req.params;
    const { careerPathId } = req.query;

    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user!._id,
    });

    if (!resume) {
      throw new AppError('Resume not found.', 404);
    }

    const skillGap = await analyzeSkillGap(
      resume.parsed.skills,
      careerPathId as string | undefined
    );

    res.json({
      success: true,
      data: skillGap,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/career/roadmap/:careerPathId
 * @desc    Get a personalized learning roadmap for a career path based on user's resume
 */
export const getPersonalizedRoadmap = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { careerPathId } = req.params;
    const { resumeId } = req.query;

    if (!resumeId) {
      throw new AppError('resumeId query parameter is required.', 400);
    }

    const resume = await Resume.findOne({
      _id: resumeId as string,
      userId: req.user!._id,
    });

    if (!resume) {
      throw new AppError('Resume not found.', 404);
    }

    if (!resume.isProcessed || !resume.parsed.skills.length) {
      throw new AppError('Resume has not been processed yet or no skills were extracted.', 400);
    }

    const roadmap = await generatePersonalizedRoadmap(
      resume.parsed.skills,
      careerPathId as string
    );

    res.json({
      success: true,
      data: roadmap,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/career/dashboard
 * @desc    Get dashboard analytics for current user
 */
export const getDashboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!._id;

    const [resumeCount, latestResume, latestRecommendation] = await Promise.all([
      Resume.countDocuments({ userId }),
      Resume.findOne({ userId }).sort({ createdAt: -1 }).select('parsed.skills originalFilename createdAt'),
      Recommendation.findOne({ userId })
        .sort({ createdAt: -1 })
        .select('careerPaths skillGap createdAt'),
    ]);

    const topSkills = latestResume?.parsed?.skills?.slice(0, 10) || [];
    const topCareerMatches =
      latestRecommendation?.careerPaths
        ?.sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5) || [];

    res.json({
      success: true,
      data: {
        stats: {
          resumesUploaded: resumeCount,
          skillsIdentified: latestResume?.parsed?.skills?.length || 0,
          careerMatchesFound: latestRecommendation?.careerPaths?.length || 0,
          skillGapPercentage: latestRecommendation?.skillGap?.gapPercentage || 0,
        },
        topSkills,
        topCareerMatches,
        latestResume: latestResume
          ? {
              id: latestResume._id,
              filename: latestResume.originalFilename,
              uploadedAt: latestResume.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

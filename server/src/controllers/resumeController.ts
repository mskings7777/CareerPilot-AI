import { Response, NextFunction } from 'express';
import path from 'path';
import { Resume } from '../models';
import { AuthRequest, AppError } from '../middleware';
import { extractTextFromFile, parseResumeText, generateResumeCoachReport } from '../services';

/**
 * @route   POST /api/resume/upload
 * @desc    Upload and parse a resume
 */
export const uploadResume = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a resume file (PDF or DOCX).', 400);
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    let fileType: 'pdf' | 'docx';

    if (ext === '.pdf') {
      fileType = 'pdf';
    } else if (ext === '.docx') {
      fileType = 'docx';
    } else {
      throw new AppError('Unsupported file format. Please upload a PDF or DOCX file.', 400);
    }

    // Extract text from file
    const rawText = await extractTextFromFile(file.buffer, fileType);

    // Parse the extracted text
    const parsed = await parseResumeText(rawText);

    // Create resume record
    const resume = await Resume.create({
      userId: req.user!._id,
      originalFilename: file.originalname,
      filePath: `memory:${file.originalname}`,
      fileType,
      rawText,
      parsed,
      isProcessed: true,
      processedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and parsed successfully.',
      data: {
        _id: resume._id,
        userId: resume.userId,
        originalFilename: resume.originalFilename,
        fileType: resume.fileType,
        parsed: resume.parsed,
        isProcessed: resume.isProcessed,
        processedAt: resume.processedAt,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/resume
 * @desc    Get all resumes for current user
 */
export const getResumes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resumes = await Resume.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .select('-rawText');

    res.json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/resume/:id
 * @desc    Get a single resume by ID
 */
export const getResumeById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!resume) {
      throw new AppError('Resume not found.', 404);
    }

    res.json({
      success: true,
      data: resume,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/resume/:id/suggestions
 * @desc    Get personalized resume improvement suggestions and project ideas
 */
export const getResumeSuggestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!resume) {
      throw new AppError('Resume not found.', 404);
    }

    if (!resume.isProcessed || !resume.parsed.skills.length) {
      throw new AppError('Resume has not been processed yet or no skills were extracted.', 400);
    }

    const report = await generateResumeCoachReport(resume);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/resume/:id
 * @desc    Delete a resume
 */
export const deleteResume = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id,
    });

    if (!resume) {
      throw new AppError('Resume not found.', 404);
    }

    res.json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

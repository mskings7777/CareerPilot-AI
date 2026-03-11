import { Router } from 'express';
import {
  analyzeAndRecommend,
  getRecommendations,
  getRecommendationById,
  getCareerPaths,
  getCareerPathBySlug,
  getSkillGapForCareer,
  getPersonalizedRoadmap,
  getDashboard,
} from '../controllers';
import { authenticate } from '../middleware';

const router = Router();

// All career routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/career/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /api/career/paths:
 *   get:
 *     summary: Get all career paths
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/paths', getCareerPaths);

/**
 * @swagger
 * /api/career/paths/{slug}:
 *   get:
 *     summary: Get career path by slug
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/paths/:slug', getCareerPathBySlug);

/**
 * @swagger
 * /api/career/analyze/{resumeId}:
 *   post:
 *     summary: Analyze resume and generate career recommendations
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/analyze/:resumeId', analyzeAndRecommend);

/**
 * @swagger
 * /api/career/recommendations:
 *   get:
 *     summary: Get all recommendations for current user
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/recommendations', getRecommendations);

/**
 * @swagger
 * /api/career/recommendations/{id}:
 *   get:
 *     summary: Get recommendation by ID
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/recommendations/:id', getRecommendationById);

/**
 * @swagger
 * /api/career/skill-gap/{resumeId}:
 *   get:
 *     summary: Get skill gap analysis for a resume
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: careerPathId
 *         schema: { type: string }
 *         description: Optional career path ID to compare against
 */
router.get('/skill-gap/:resumeId', getSkillGapForCareer);

/**
 * @swagger
 * /api/career/roadmap/{careerPathId}:
 *   get:
 *     summary: Get personalized learning roadmap for a career path
 *     tags: [Career]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: careerPathId
 *         required: true
 *         schema: { type: string }
 *         description: Career path ID
 *       - in: query
 *         name: resumeId
 *         required: true
 *         schema: { type: string }
 *         description: Resume ID to personalize the roadmap
 */
router.get('/roadmap/:careerPathId', getPersonalizedRoadmap);

export default router;

export {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
} from './authController';

export {
  uploadResume,
  getResumes,
  getResumeById,
  deleteResume,
} from './resumeController';

export {
  analyzeAndRecommend,
  getRecommendations,
  getRecommendationById,
  getCareerPaths,
  getCareerPathBySlug,
  getSkillGapForCareer,
  getPersonalizedRoadmap,
  getDashboard,
} from './careerController';

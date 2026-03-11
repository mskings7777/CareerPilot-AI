import { Router } from 'express';
import authRoutes from './authRoutes';
import resumeRoutes from './resumeRoutes';
import careerRoutes from './careerRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/resume', resumeRoutes);
router.use('/career', careerRoutes);

export default router;

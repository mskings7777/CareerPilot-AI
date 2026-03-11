import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadResume, getResumes, getResumeById, deleteResume } from '../controllers';
import { authenticate } from '../middleware';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

const router = Router();

// All resume routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/resume/upload:
 *   post:
 *     summary: Upload and parse a resume
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201: { description: Resume uploaded and parsed }
 */
router.post('/upload', upload.single('resume'), uploadResume);

/**
 * @swagger
 * /api/resume:
 *   get:
 *     summary: Get all resumes for current user
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', getResumes);

/**
 * @swagger
 * /api/resume/{id}:
 *   get:
 *     summary: Get a resume by ID
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', getResumeById);

/**
 * @swagger
 * /api/resume/{id}:
 *   delete:
 *     summary: Delete a resume
 *     tags: [Resume]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', deleteResume);

export default router;

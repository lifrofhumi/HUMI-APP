import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload';

const router = Router();

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

router.post('/', upload.single('image'), uploadImage);

export default router;

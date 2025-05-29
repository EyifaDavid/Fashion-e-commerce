import multer from 'multer';

// Store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;

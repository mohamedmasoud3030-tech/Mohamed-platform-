import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { createAuthContext } from "../middleware/auth";
import {
  PROJECT_MEDIA_MAX_BYTES,
  PROJECT_MEDIA_MIME_EXTENSIONS,
  ProjectMediaStorageError,
  storeProjectMedia,
} from "../lib/project-media-storage";

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const { user } = await createAuthContext(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PROJECT_MEDIA_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (PROJECT_MEDIA_MIME_EXTENSIONS.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ProjectMediaStorageError("Unsupported file type.", 415));
    }
  },
});

function handleUploadErrors(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (!error) return next();
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "File exceeds the 100MB upload limit." });
    return;
  }
  if (error instanceof ProjectMediaStorageError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  next(error);
}

const router: IRouter = Router();

router.post("/upload", requireAdmin, upload.single("file"), handleUploadErrors, async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  try {
    const stored = await storeProjectMedia(req.file);
    res.json(stored);
  } catch (error) {
    if (error instanceof ProjectMediaStorageError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export default router;

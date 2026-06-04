import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { createAuthContext } from "../middleware/auth";
import { createSignedProjectMediaUpload, ProjectMediaStorageError } from "../lib/project-media-storage";

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

const router: IRouter = Router();

router.post("/upload/sign", requireAdmin, async (req: Request, res: Response) => {
  try {
    const mimeType = typeof req.body.mimeType === "string" ? req.body.mimeType : "";
    const size = Number(req.body.size);
    res.json(await createSignedProjectMediaUpload(mimeType, size));
  } catch (error) {
    if (error instanceof ProjectMediaStorageError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    throw error;
  }
});

export default router;

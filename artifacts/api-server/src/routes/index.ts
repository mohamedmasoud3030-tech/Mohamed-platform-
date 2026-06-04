import { Router, type IRouter } from "express";
import healthRouter from "./health";
import directUploadRouter from "./direct-upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(directUploadRouter);

export default router;

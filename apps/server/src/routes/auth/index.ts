import { Router } from "express";
import signInRoutes from "./signin/index";
import signUpRoutes from "./signup/index";

import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

router.use("/signin", signInRoutes);
router.use("/signup", signUpRoutes);


export default router;

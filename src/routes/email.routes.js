import { Router } from "express";
import { testEmailParse } from "../controllers/email.controller.js";

const router = Router();

router.route('/parse-test').get(testEmailParse);

export default router;
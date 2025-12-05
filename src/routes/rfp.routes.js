import { Router } from "express";
import { compareProposals, generateRFP, sendRfpToVendors, listRFPs, getRFPById, getProposalsByRFP } from "../controllers/rfp.controllers.js";

const router = Router();

router.route('/generate').post(generateRFP);
router.route("/send").post(sendRfpToVendors);
router.route("/list").get(listRFPs);
router.route("/:id").get(getRFPById);
router.route("/:id/proposals").get(getProposalsByRFP);
router.route("/:id/comparison").get(compareProposals);

export default router;


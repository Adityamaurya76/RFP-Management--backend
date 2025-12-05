import { Router } from "express";
import { create, list, update, venderDelete } from "../controllers/vendor.controllers.js";

const router = Router();

router.route("/list").get(list);
router.route("/create").post(create);
router.route("/update/:id").put(update);
router.route("/delete/:id").delete(venderDelete);

export default router;
import path from "path";
import express from "express";
import { createBook } from "./bookController";
import multer from "multer";

const bookRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 3e7 }, // 30MB
});

bookRouter.post(
  "/",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),

  createBook
);

export default bookRouter;
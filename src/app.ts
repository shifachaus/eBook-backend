import express from "express";
import cors from "cors";
import globalErrorHandler from "./middlewares/globalErrorHandler";

import userRouter from "./user/userRouter";
import bookRouter from "./book/bookRouter";
import { config } from "./config/config";

const app = express();

app.use(
  cors({
    origin: config.frontendDomain,
  })
);

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to eBook apis" });
});

app.use("/api/users", userRouter);
app.use("/api/books", bookRouter);

//Global error handler
app.use(globalErrorHandler);

export default app;

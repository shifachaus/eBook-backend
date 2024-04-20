import express from "express";
import createHttpError from "http-errors";
import globalErrorHandler from "./middlewares/globalErrorHandler";

const app = express();

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to eBook apis" });
});

//Global error handler
app.use(globalErrorHandler);

export default app;

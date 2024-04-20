import express from "express";
import createHttpError from "http-errors";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/UserRouter";

const app = express();

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to eBook apis" });
});

app.use("/api/users", userRouter);

//Global error handler
app.use(globalErrorHandler);

export default app;

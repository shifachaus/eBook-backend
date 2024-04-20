import express from "express";

const app = express();

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to eBook apis" });
});

export default app;

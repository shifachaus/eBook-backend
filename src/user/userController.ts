import { Request, Response, NextFunction } from "express";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  res.json({ message: "user created" });
};

export { createUser };
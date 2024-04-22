import { User } from "../user/userTypes";

interface Image {
  public_id: string;
  url: string;
}

export interface Book {
  _id: string;
  title: string;
  author: User;
  genre: string;
  coverImage: Image;
  file: Image;
  createdAt: Date;
  updatedAt: Date;
}

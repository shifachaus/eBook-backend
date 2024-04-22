import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

import { AuthRequest } from "../middlewares/authenticate";

import bookModel from "./bookModel";

import cloudinary from "../config/cloudinary";
import createHttpError from "http-errors";

interface CloudinaryFile {
  public_id: string;
  url: string;
}

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  // 'application/pdf'
  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      },
      file: {
        public_id: bookFileUploadResult.public_id,
        url: bookFileUploadResult.secure_url,
      },
    });

    // delete temp files
    await fs.promises.unlink(filePath);
    await fs.promises.unlink(bookFilePath);

    res.status(201).json({ id: newBook._id });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while uploading the files."));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;

  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // Check access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You can not update others book."));
  }

  // check if image field is exists.
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  let completeCoverImage: CloudinaryFile | string = "";
  if (files.coverImage) {
    const filename = files.coverImage[0].filename;
    const converMimeType = files.coverImage[0].mimetype.split("/").at(-1);

    // send files to cloudinary
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + filename
    );
    completeCoverImage = filename;
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: completeCoverImage,
      folder: "book-covers",
      format: converMimeType,
    });

    completeCoverImage = {
      public_id: uploadResult.public_id,
      url: uploadResult.secure_url,
    };

    await fs.promises.unlink(filePath);
  }

  // check if file field is exists.
  let completeFileName: CloudinaryFile | string = "";
  if (files.file) {
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads/" + files.file[0].filename
    );

    const bookFileName = files.file[0].filename;
    completeFileName = bookFileName;

    const uploadResultPdf = await cloudinary.uploader.upload(bookFilePath, {
      resource_type: "raw",
      filename_override: completeFileName,
      folder: "book-pdfs",
      format: "pdf",
    });

    completeFileName = {
      public_id: uploadResultPdf.public_id,
      url: uploadResultPdf.secure_url,
    };
    await fs.promises.unlink(bookFilePath);
  }

  try {
    if (book.coverImage.public_id) {
      await cloudinary.uploader.destroy(book.coverImage.public_id);
      console.log("Old image deleted successfully");
    }

    if (book.file.public_id) {
      await cloudinary.uploader.destroy(book.file.public_id, {
        resource_type: "raw",
      });
      console.log("Old file deleted successfully");
    }
  } catch (error) {
    return next(createHttpError(403, "Error while deleting cover image"));
  }

  const updatedBook = await bookModel.findOneAndUpdate(
    {
      _id: bookId,
    },
    {
      title: title,
      genre: genre,

      coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
      file: completeFileName ? completeFileName : book.file,
    },
    { new: true }
  );

  res.json(updatedBook);
};

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = await bookModel.find();
    res.json(book);
  } catch (err) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const getSingleBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const bookId = req.params.bookId;
  try {
    const book = await bookModel.findOne({ _id: bookId });

    if (!book) {
      return next(createHttpError(404, "Book not found."));
    }
    res.json(book);
  } catch (err) {
    return next(createHttpError(500, "Error while getting a book"));
  }
};

const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  const bookId = req.params.bookId;
  const book = await bookModel.findOne({ _id: bookId });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // Check Access
  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "You can not update others book."));
  }

  try {
    if (book.coverImage.public_id) {
      await cloudinary.uploader.destroy(book.coverImage.public_id);
      console.log("image deleted successfully");
    }

    if (book.file.public_id) {
      await cloudinary.uploader.destroy(book.file.public_id, {
        resource_type: "raw",
      });
      console.log("file deleted successfully");
    }
  } catch (error) {
    return next(createHttpError(403, "Error while deleting cover image"));
  }

  await bookModel.deleteOne({ _id: bookId });
  return res.sendStatus(204);
};

export { createBook, updateBook, listBooks, getSingleBook, deleteBook };

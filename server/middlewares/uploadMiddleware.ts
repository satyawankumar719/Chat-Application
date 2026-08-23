import multer from "multer";
import type { StorageEngine, FileFilterCallback } from "multer";
import fs from 'fs';
import path from 'path';
import type { Request } from 'express';

export interface MulterFileWithSubfolder extends Express.Multer.File {
  subfolder?: string;
}

const uploadsFolder = path.resolve("uploads");
const subfolders = ["avatars", "images", "videos", "files", "temp"];

subfolders.forEach((sub: string) => {
  const folderPath = path.join(uploadsFolder, sub);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

function getSubfolder(file: Express.Multer.File, req: Request): string {
  if (
    file.fieldname === "avatar" ||
    (req.originalUrl && req.originalUrl.includes("/users/profile"))
  ) {
    return "avatars";
  }
  if (file.mimetype.startsWith("image/")) {
    return "images";
  }
  if (file.mimetype.startsWith("video/")) {
    return "videos";
  }
  return "files";
}

const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file: MulterFileWithSubfolder, cb: (error: Error | null, destination: string) => void) {
    const subfolder = getSubfolder(file, req);
    file.subfolder = subfolder;
    const targetFolder = path.join(uploadsFolder, subfolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    cb(null, targetFolder);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueFile = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueFile + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export default upload;

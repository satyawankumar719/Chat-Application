import multer from "multer";
import fs from 'fs';
import path from 'path';

const uploadsFolder = path.resolve("uploads");
const subfolders = ["avatars", "images", "videos", "files", "temp"];

subfolders.forEach((sub) => {
  const folderPath = path.join(uploadsFolder, sub);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

function getSubfolder(file, req) {
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const subfolder = getSubfolder(file, req);
    file.subfolder = subfolder;
    const targetFolder = path.join(uploadsFolder, subfolder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    cb(null, targetFolder);
  },
  filename: function (req, file, cb) {
    const uniqueFile = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueFile + "-" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"));
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export default upload;


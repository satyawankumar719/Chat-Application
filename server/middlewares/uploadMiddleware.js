import multer from "multer";
import fs from 'fs';
import path from 'path';

const uploadsFolder = path.resolve("uploads");
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }
    cb(null, uploadsFolder);
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


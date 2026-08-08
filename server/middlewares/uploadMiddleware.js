import multer from "multer";
import fs  from 'fs';
const storage = multer.diskStorage({
    
  destination: function (req, file, cb) {
      if (!fs.existsSync("uploads")) {
    cb(new Error("Uploads folder does not exist"), null);}
    else
    cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        
        const uniqueFile = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueFile + "-" + file.originalname);
    }   
});


const fileFilter = (req, file, cb) => {
   
    const allowedTypes = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/x-icon",

  // Documents
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx

  // Excel
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx

  // PowerPoint
  "application/vnd.ms-powerpoint", // .ppt
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx

  // Text
  "text/plain", // .txt
  "text/csv",   // .csv

  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed"
];
    file.mimetype.startsWith("image/") && allowedTypes.includes(file.mimetype)
   
        ? cb(null, true)
        : cb(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."), false);
}
const upload = multer({ storage: storage, fileFilter: fileFilter ,limits :{fileSize : 25 * 1024 * 1024}});

export default upload;

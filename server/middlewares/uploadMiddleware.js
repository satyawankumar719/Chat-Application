import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueFile = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueFile + "-" + file.originalname);
    }   
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    file.mimetype.startsWith("image/") && allowedTypes.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error("Invalid file type. Only JPEG, PNG, and GIF are allowed."), false);
}
const upload = multer({ storage: storage, fileFilter: fileFilter });

export default upload;

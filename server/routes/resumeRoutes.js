const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  uploadResume,
} = require("../controllers/resumeController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* =================================
   MULTER STORAGE
================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

/* =================================
   FILE VALIDATION
================================= */

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const allowedExtensions = [
    ".pdf",
    ".docx",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF and DOCX resumes are supported."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* =================================
   ROUTE
================================= */

router.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
  uploadResume
);

module.exports = router;
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

const parseResume = async (filePath, mimeType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("Resume file not found");
  }

  const extension = path.extname(filePath).toLowerCase();

  // ================================
  // PDF
  // ================================
   if (
  mimeType === "application/pdf" ||
  extension === ".pdf"
) {
  const buffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getText();

    return (result.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

  // ================================
  // DOCX
  // ================================
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const result = await mammoth.extractRawText({
      path: filePath,
    });

    return (result.value || "").trim();
  }

  throw new Error(
    "Unsupported resume format. Please upload PDF or DOCX."
  );
};

module.exports = {
  parseResume,
};
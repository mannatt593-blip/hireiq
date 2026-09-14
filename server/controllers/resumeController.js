const fs = require("fs");
const pool = require("../config/db");
const {
  parseResume,
} = require("../services/resumeParser");

const {
  extractCandidateProfile,
} = require("../services/resumeAIService");

/* =================================
   UPLOAD + PARSE + CREATE CANDIDATE
================================= */

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required",
      });
    }

    const filePath = req.file.path;

    /* ================================
       STEP 1 — EXTRACT TEXT
    ================================= */

    const resumeText = await parseResume(
      filePath,
      req.file.mimetype
    );

    if (!resumeText) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return res.status(400).json({
        success: false,
        message:
          "Unable to extract text from the resume",
      });
    }

    /* ================================
       STEP 2 — AI PROFILE EXTRACTION
    ================================= */

    const profile =
      await extractCandidateProfile(
        resumeText
      );

    /* ================================
       STEP 3 — SAVE CANDIDATE
    ================================= */

    const skillsText =
      profile.skills.join(", ");

    const result = await pool.query(
      `
      INSERT INTO candidates (
        name,
        email,
        phone,
        location,
        headline,
        experience_years,
        skills,
        education,
        resume_url,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
      `,
      [
        profile.name,
        profile.email || null,
        profile.phone || null,
        profile.location || null,
        profile.headline || null,
        profile.experience_years || null,
        skillsText || null,
        profile.education || null,
        filePath,
        "Available",
      ]
    );

    /* ================================
       SUCCESS
    ================================= */

    return res.status(201).json({
      success: true,

      message:
        "Resume uploaded, parsed and candidate created successfully",

      candidate: result.rows[0],

      ai_profile: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        headline: profile.headline,
        experience_years:
          profile.experience_years,
        skills: profile.skills,
        education: profile.education,
        certifications:
          profile.certifications,
        projects: profile.projects,
      },

      resume: {
        original_name:
          req.file.originalname,

        filename:
          req.file.filename,

        mime_type:
          req.file.mimetype,

        size: req.file.size,
      },
    });
  } catch (error) {
    console.error(
      "Resume processing error:",
      error
    );

    if (
      req.file?.path &&
      fs.existsSync(req.file.path)
    ) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {}
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Resume processing failed",
    });
  }
};

module.exports = {
  uploadResume,
};
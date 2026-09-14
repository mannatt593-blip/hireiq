const pool = require("../config/db");

/* =================================
   CREATE CANDIDATE
================================= */

const createCandidate = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      headline,
      experience_years,
      skills,
      education,
      resume_url,
      profile_image_url,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Candidate name is required",
      });
    }

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
        profile_image_url,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        name.trim(),
        email?.toLowerCase().trim() || null,
        phone || null,
        location || null,
        headline || null,
        experience_years || null,
        skills || null,
        education || null,
        resume_url || null,
        profile_image_url || null,
        status || "Available",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error("Create candidate error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating candidate",
    });
  }
};

/* =================================
   GET ALL CANDIDATES
================================= */

const getCandidates = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM candidates
      ORDER BY created_at DESC
      `
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      candidates: result.rows,
    });
  } catch (error) {
    console.error("Get candidates error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching candidates",
    });
  }
};

/* =================================
   GET SINGLE CANDIDATE
================================= */

const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM candidates
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error("Get candidate error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching candidate",
    });
  }
};

/* =================================
   UPDATE CANDIDATE
================================= */

const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      location,
      headline,
      experience_years,
      skills,
      education,
      resume_url,
      profile_image_url,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Candidate name is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE candidates
      SET
        name = $1,
        email = $2,
        phone = $3,
        location = $4,
        headline = $5,
        experience_years = $6,
        skills = $7,
        education = $8,
        resume_url = $9,
        profile_image_url = $10,
        status = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
      `,
      [
        name.trim(),
        email?.toLowerCase().trim() || null,
        phone || null,
        location || null,
        headline || null,
        experience_years || null,
        skills || null,
        education || null,
        resume_url || null,
        profile_image_url || null,
        status || "Available",
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error("Update candidate error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating candidate",
    });
  }
};

/* =================================
   DELETE CANDIDATE
================================= */

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM candidates
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    console.error("Delete candidate error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting candidate",
    });
  }
};

module.exports = {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
};
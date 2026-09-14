const pool = require("../config/db");

/* =================================
   CREATE JOB
================================= */

const createJob = async (req, res) => {
  try {
    const {
      title,
      department,
      location,
      employment_type,
      experience_level,
      description,
      requirements,
      salary_min,
      salary_max,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job title is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO jobs (
        user_id,
        title,
        department,
        location,
        employment_type,
        experience_level,
        description,
        requirements,
        salary_min,
        salary_max,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        req.user.id,
        title.trim(),
        department || null,
        location || null,
        employment_type || "Full-time",
        experience_level || null,
        description || null,
        requirements || null,
        salary_min || null,
        salary_max || null,
        status || "Active",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job: result.rows[0],
    });
  } catch (error) {
    console.error("Create job error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating job",
    });
  }
};

/* =================================
   GET ALL JOBS
================================= */

const getJobs = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM jobs
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      jobs: result.rows,
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching jobs",
    });
  }
};

/* =================================
   GET SINGLE JOB
================================= */

const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM jobs
      WHERE id = $1 AND user_id = $2
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job: result.rows[0],
    });
  } catch (error) {
    console.error("Get job error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching job",
    });
  }
};

/* =================================
   UPDATE JOB
================================= */

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      department,
      location,
      employment_type,
      experience_level,
      description,
      requirements,
      salary_min,
      salary_max,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job title is required",
      });
    }

    const result = await pool.query(
      `
      UPDATE jobs
      SET
        title = $1,
        department = $2,
        location = $3,
        employment_type = $4,
        experience_level = $5,
        description = $6,
        requirements = $7,
        salary_min = $8,
        salary_max = $9,
        status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND user_id = $12
      RETURNING *
      `,
      [
        title.trim(),
        department || null,
        location || null,
        employment_type || "Full-time",
        experience_level || null,
        description || null,
        requirements || null,
        salary_min || null,
        salary_max || null,
        status || "Active",
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job: result.rows[0],
    });
  } catch (error) {
    console.error("Update job error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating job",
    });
  }
};

/* =================================
   DELETE JOB
================================= */

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM jobs
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting job",
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
};
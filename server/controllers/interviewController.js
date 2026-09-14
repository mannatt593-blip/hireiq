const pool = require("../config/db");

/* =================================
   CREATE INTERVIEW
================================= */

const createInterview = async (req, res) => {
  try {
    const {
      application_id,
      interviewer_id,
      interview_type,
      scheduled_at,
      duration_minutes,
      meeting_link,
      location,
      notes,
    } = req.body;

    if (!application_id || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message:
          "application_id and scheduled_at are required",
      });
    }

    const applicationCheck = await pool.query(
      `
      SELECT
        a.id,
        a.candidate_id,
        j.id AS job_id,
        j.title AS job_title,
        c.name AS candidate_name,
        c.email AS candidate_email
      FROM applications a
      INNER JOIN jobs j
        ON a.job_id = j.id
      INNER JOIN candidates c
        ON a.candidate_id = c.id
      WHERE a.id = $1
        AND j.user_id = $2
      `,
      [application_id, req.user.id]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const application = applicationCheck.rows[0];

    const interviewResult = await pool.query(
      `
      INSERT INTO interviews (
        application_id,
        interviewer_id,
        interview_type,
        scheduled_at,
        duration_minutes,
        meeting_link,
        location,
        status,
        notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        application_id,
        interviewer_id || req.user.id,
        interview_type || "Video",
        scheduled_at,
        duration_minutes || 30,
        meeting_link || null,
        location || null,
        "Scheduled",
        notes || null,
      ]
    );

    await pool.query(
      `
      UPDATE applications
      SET
        status = 'Interview Scheduled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [application_id]
    );

    await pool.query(
      `
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        req.user.id,
        "Interview scheduled",
        `Interview scheduled for ${application.candidate_name} for ${application.job_title}.`,
        "interview",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Interview scheduled successfully",
      interview: interviewResult.rows[0],
    });
  } catch (error) {
    console.error("Create interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while scheduling interview",
    });
  }
};

/* =================================
   GET INTERVIEWS
================================= */

const getInterviews = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        i.*,
        a.status AS application_status,
        a.ai_match_score,

        j.title AS job_title,

        c.id AS candidate_id,
        c.name AS candidate_name,
        c.email AS candidate_email,
        c.headline AS candidate_headline

      FROM interviews i

      INNER JOIN applications a
        ON i.application_id = a.id

      INNER JOIN jobs j
        ON a.job_id = j.id

      INNER JOIN candidates c
        ON a.candidate_id = c.id

      WHERE j.user_id = $1

      ORDER BY i.scheduled_at ASC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      interviews: result.rows,
    });
  } catch (error) {
    console.error("Get interviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching interviews",
    });
  }
};

/* =================================
   GET SINGLE INTERVIEW
================================= */

const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        i.*,
        j.title AS job_title,
        c.name AS candidate_name,
        c.email AS candidate_email,
        c.headline AS candidate_headline,
        a.ai_match_score
      FROM interviews i

      INNER JOIN applications a
        ON i.application_id = a.id

      INNER JOIN jobs j
        ON a.job_id = j.id

      INNER JOIN candidates c
        ON a.candidate_id = c.id

      WHERE i.id = $1
        AND j.user_id = $2
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      interview: result.rows[0],
    });
  } catch (error) {
    console.error("Get interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching interview",
    });
  }
};

/* =================================
   UPDATE INTERVIEW
================================= */

const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      interview_type,
      scheduled_at,
      duration_minutes,
      meeting_link,
      location,
      status,
      notes,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE interviews i
      SET
        interview_type =
          COALESCE($1, i.interview_type),

        scheduled_at =
          COALESCE($2, i.scheduled_at),

        duration_minutes =
          COALESCE($3, i.duration_minutes),

        meeting_link =
          COALESCE($4, i.meeting_link),

        location =
          COALESCE($5, i.location),

        status =
          COALESCE($6, i.status),

        notes =
          COALESCE($7, i.notes),

        updated_at =
          CURRENT_TIMESTAMP

      FROM applications a
      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE i.id = $8
        AND i.application_id = a.id
        AND j.user_id = $9

      RETURNING i.*
      `,
      [
        interview_type ?? null,
        scheduled_at ?? null,
        duration_minutes ?? null,
        meeting_link ?? null,
        location ?? null,
        status ?? null,
        notes ?? null,
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview updated successfully",
      interview: result.rows[0],
    });
  } catch (error) {
    console.error("Update interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating interview",
    });
  }
};

/* =================================
   DELETE INTERVIEW
================================= */

const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM interviews i
      USING applications a, jobs j
      WHERE i.id = $1
        AND i.application_id = a.id
        AND a.job_id = j.id
        AND j.user_id = $2
      RETURNING i.id, i.application_id
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview deleted successfully",
    });
  } catch (error) {
    console.error("Delete interview error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting interview",
    });
  }
};

module.exports = {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
};
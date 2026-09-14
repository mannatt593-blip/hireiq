const pool = require("../config/db");
const { screenCandidate } = require("../services/aiService");

/* =================================
   CREATE APPLICATION
   + AUTOMATIC AI SCREENING
================================= */

const createApplication = async (req, res) => {
  try {
    const { job_id, candidate_id, status } = req.body;

    if (!job_id || !candidate_id) {
      return res.status(400).json({
        success: false,
        message: "job_id and candidate_id are required",
      });
    }

    /* ================================
       VERIFY JOB
    ================================= */

    const jobCheck = await pool.query(
      `
      SELECT *
      FROM jobs
      WHERE id = $1
        AND user_id = $2
      `,
      [job_id, req.user.id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const job = jobCheck.rows[0];

    /* ================================
       VERIFY CANDIDATE
    ================================= */

    const candidateCheck = await pool.query(
      `
      SELECT *
      FROM candidates
      WHERE id = $1
      `,
      [candidate_id]
    );

    if (candidateCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const candidate = candidateCheck.rows[0];

    /* ================================
       DUPLICATE CHECK
    ================================= */

    const existingApplication =
      await pool.query(
        `
        SELECT id
        FROM applications
        WHERE job_id = $1
          AND candidate_id = $2
        `,
        [job_id, candidate_id]
      );

    if (existingApplication.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Candidate has already applied to this job",
      });
    }

    /* ================================
       CREATE APPLICATION
    ================================= */

    const applicationResult =
      await pool.query(
        `
        INSERT INTO applications (
          job_id,
          candidate_id,
          status
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
          job_id,
          candidate_id,
          status || "Screening",
        ]
      );

    const application =
      applicationResult.rows[0];

    /* ================================
       UPDATE APPLICATION COUNT
    ================================= */

    await pool.query(
      `
      UPDATE jobs
      SET
        applications_count =
          applications_count + 1,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [job_id]
    );

    /* ================================
       AUTOMATIC AI SCREENING
    ================================= */

    let aiAnalysis = null;

    try {
      aiAnalysis = await screenCandidate({
        job: {
          title: job.title,
          department: job.department,
          location: job.location,
          employment_type:
            job.employment_type,
          experience_level:
            job.experience_level,
          description:
            job.description,
          requirements:
            job.requirements,
        },

        candidate: {
          name: candidate.name,
          email: candidate.email,
          headline: candidate.headline,
          experience_years:
            candidate.experience_years,
          skills: candidate.skills,
          education: candidate.education,
          resume_url: candidate.resume_url,
        },
      });

      /* ================================
         SAVE AI SCREENING
      ================================= */

      const screeningResult =
        await pool.query(
          `
          INSERT INTO ai_screenings (
            application_id,
            match_score,
            confidence_score,
            skills_match_score,
            experience_match_score,
            education_match_score,
            matched_skills,
            missing_skills,
            recommendation,
            ai_summary
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
          )
          RETURNING *
          `,
          [
            application.id,
            aiAnalysis.match_score,
            aiAnalysis.confidence_score,
            aiAnalysis.skills_match_score,
            aiAnalysis.experience_match_score,
            aiAnalysis.education_match_score,
            JSON.stringify(
              aiAnalysis.matched_skills
            ),
            JSON.stringify(
              aiAnalysis.missing_skills
            ),
            aiAnalysis.recommendation,
            aiAnalysis.ai_summary,
          ]
        );

      /* ================================
         SAVE SCORE ON APPLICATION
      ================================= */

      const updatedApplication =
        await pool.query(
          `
          UPDATE applications
          SET
            ai_match_score = $1,
            updated_at =
              CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
          `,
          [
            aiAnalysis.match_score,
            application.id,
          ]
        );

      return res.status(201).json({
        success: true,
        message:
          "Application created and AI screening completed successfully",

        application:
          updatedApplication.rows[0],

        screening:
          screeningResult.rows[0],

        ai_analysis: aiAnalysis,
      });
    } catch (aiError) {
      /*
       * Application should still exist even if
       * the external AI provider is temporarily unavailable.
       */
      console.error(
        "Automatic AI screening failed:",
        aiError.message
      );

      return res.status(201).json({
        success: true,
        message:
          "Application created successfully. AI screening is pending.",

        application,

        ai_analysis: null,

        ai_status: "pending",

        ai_error:
          "AI screening could not be completed right now.",
      });
    }
  } catch (error) {
    console.error(
      "Create application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating application",
    });
  }
};

/* =================================
   GET ALL APPLICATIONS
================================= */

const getApplications = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        a.id,
        a.job_id,
        a.candidate_id,
        a.status,
        a.ai_match_score,
        a.applied_at,
        a.updated_at,

        j.title AS job_title,
        j.department AS job_department,
        j.location AS job_location,

        c.name AS candidate_name,
        c.email AS candidate_email,
        c.phone AS candidate_phone,
        c.location AS candidate_location,
        c.headline AS candidate_headline,
        c.experience_years,
        c.skills,
        c.education

      FROM applications a

      INNER JOIN jobs j
        ON a.job_id = j.id

      INNER JOIN candidates c
        ON a.candidate_id = c.id

      WHERE j.user_id = $1

      ORDER BY
        a.ai_match_score DESC NULLS LAST,
        a.applied_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      applications: result.rows,
    });
  } catch (error) {
    console.error(
      "Get applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching applications",
    });
  }
};

/* =================================
   GET SINGLE APPLICATION
================================= */

const getApplicationById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        a.id,
        a.job_id,
        a.candidate_id,
        a.status,
        a.ai_match_score,
        a.applied_at,
        a.updated_at,

        j.title AS job_title,
        j.department AS job_department,
        j.location AS job_location,

        c.name AS candidate_name,
        c.email AS candidate_email,
        c.phone AS candidate_phone,
        c.location AS candidate_location,
        c.headline AS candidate_headline,
        c.experience_years,
        c.skills,
        c.education,
        c.resume_url,
        c.profile_image_url

      FROM applications a

      INNER JOIN jobs j
        ON a.job_id = j.id

      INNER JOIN candidates c
        ON a.candidate_id = c.id

      WHERE a.id = $1
        AND j.user_id = $2
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      application: result.rows[0],
    });
  } catch (error) {
    console.error(
      "Get application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching application",
    });
  }
};

/* =================================
   UPDATE APPLICATION
================================= */

const updateApplication = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const {
      status,
      ai_match_score,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE applications a
      SET
        status =
          COALESCE($1, a.status),

        ai_match_score =
          COALESCE($2, a.ai_match_score),

        updated_at =
          CURRENT_TIMESTAMP

      FROM jobs j

      WHERE a.id = $3
        AND a.job_id = j.id
        AND j.user_id = $4

      RETURNING a.*
      `,
      [
        status ?? null,
        ai_match_score ?? null,
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Application updated successfully",
      application:
        result.rows[0],
    });
  } catch (error) {
    console.error(
      "Update application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating application",
    });
  }
};

/* =================================
   DELETE APPLICATION
================================= */

const deleteApplication = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM applications a
      USING jobs j

      WHERE a.id = $1
        AND a.job_id = j.id
        AND j.user_id = $2

      RETURNING
        a.id,
        a.job_id
      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Application not found",
      });
    }

    const jobId =
      result.rows[0].job_id;

    await pool.query(
      `
      UPDATE jobs
      SET
        applications_count =
          GREATEST(
            applications_count - 1,
            0
          ),

        updated_at =
          CURRENT_TIMESTAMP

      WHERE id = $1
      `,
      [jobId]
    );

    return res.status(200).json({
      success: true,
      message:
        "Application deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting application",
    });
  }
};

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
};
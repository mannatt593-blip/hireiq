const pool = require("../config/db");
const { screenCandidate } = require("../services/aiService");

/* =================================
   SCREEN APPLICATION
================================= */

const screenApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        a.id AS application_id,
        a.job_id,
        a.candidate_id,

        j.title,
        j.department,
        j.location,
        j.employment_type,
        j.experience_level,
        j.description,
        j.requirements,
        j.user_id,

        c.name,
        c.email,
        c.headline,
        c.experience_years,
        c.skills,
        c.education,
        c.resume_url

      FROM applications a

      INNER JOIN jobs j
        ON a.job_id = j.id

      INNER JOIN candidates c
        ON a.candidate_id = c.id

      WHERE a.id = $1
        AND j.user_id = $2
      `,
      [applicationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const row = result.rows[0];

    const job = {
      title: row.title,
      department: row.department,
      location: row.location,
      employment_type:
        row.employment_type,
      experience_level:
        row.experience_level,
      description: row.description,
      requirements: row.requirements,
    };

    const candidate = {
      name: row.name,
      email: row.email,
      headline: row.headline,
      experience_years:
        row.experience_years,
      skills: row.skills,
      education: row.education,
      resume_url: row.resume_url,
    };

    /* ================================
       AI ANALYSIS
    ================================= */

    const aiResult = await screenCandidate({
      job,
      candidate,
    });

    /* ================================
       SAVE SCREENING
    ================================= */

    const screeningResult = await pool.query(
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
        applicationId,
        aiResult.match_score,
        aiResult.confidence_score,
        aiResult.skills_match_score,
        aiResult.experience_match_score,
        aiResult.education_match_score,
        JSON.stringify(
          aiResult.matched_skills
        ),
        JSON.stringify(
          aiResult.missing_skills
        ),
        aiResult.recommendation,
        aiResult.ai_summary,
      ]
    );

    /* ================================
       UPDATE APPLICATION SCORE
    ================================= */

    await pool.query(
      `
      UPDATE applications
      SET
        ai_match_score = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [
        aiResult.match_score,
        applicationId,
      ]
    );

    return res.status(200).json({
      success: true,
      message:
        "AI screening completed successfully",

      screening: screeningResult.rows[0],

      ai_analysis: aiResult,
    });

  } catch (error) {
    console.error(
      "AI screening error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "AI screening failed",
    });
  }
};

/* =================================
   GET SCREENING RESULTS
================================= */

const getApplicationScreening = async (
  req,
  res
) => {
  try {
    const { applicationId } = req.params;

    const result = await pool.query(
      `
      SELECT
        s.*
      FROM ai_screenings s

      INNER JOIN applications a
        ON s.application_id = a.id

      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE s.application_id = $1
        AND j.user_id = $2

      ORDER BY s.created_at DESC
      LIMIT 1
      `,
      [
        applicationId,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "No AI screening found for this application",
      });
    }

    return res.status(200).json({
      success: true,
      screening: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Get AI screening error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching AI screening",
    });
  }
};

module.exports = {
  screenApplication,
  getApplicationScreening,
};
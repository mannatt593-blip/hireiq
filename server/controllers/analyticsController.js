const pool = require("../config/db");

/* =================================
   DASHBOARD OVERVIEW
================================= */

const getDashboardAnalytics = async (req, res) => {
  try {
    /* ================================
       JOBS
    ================================= */

    const jobsResult = await pool.query(
      `
      SELECT
        COUNT(*)::INTEGER AS total_jobs,
        COUNT(*) FILTER (
          WHERE status = 'Active'
        )::INTEGER AS active_jobs
      FROM jobs
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    /* ================================
       CANDIDATES
    ================================= */

    const candidatesResult = await pool.query(`
      SELECT
        COUNT(*)::INTEGER AS total_candidates,
        COUNT(*) FILTER (
          WHERE status = 'Available'
        )::INTEGER AS available_candidates,
        COUNT(*) FILTER (
          WHERE status = 'Shortlisted'
        )::INTEGER AS shortlisted_candidates
      FROM candidates
    `);

    /* ================================
       APPLICATIONS
    ================================= */

    const applicationsResult = await pool.query(
      `
      SELECT
        COUNT(*)::INTEGER AS total_applications,

        COUNT(*) FILTER (
          WHERE a.status = 'Screening'
        )::INTEGER AS screening_count,

        COUNT(*) FILTER (
          WHERE a.status = 'Shortlisted'
        )::INTEGER AS shortlisted_count,

        COUNT(*) FILTER (
          WHERE a.status = 'Interview Scheduled'
        )::INTEGER AS interview_scheduled_count,

        COUNT(*) FILTER (
          WHERE a.status = 'Selected'
        )::INTEGER AS selected_count,

        COUNT(*) FILTER (
          WHERE a.status = 'Rejected'
        )::INTEGER AS rejected_count

      FROM applications a

      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE j.user_id = $1
      `,
      [req.user.id]
    );

    /* ================================
       INTERVIEWS
    ================================= */

    const interviewsResult = await pool.query(
      `
      SELECT
        COUNT(*)::INTEGER AS total_interviews,

        COUNT(*) FILTER (
          WHERE i.status = 'Scheduled'
        )::INTEGER AS scheduled_interviews,

        COUNT(*) FILTER (
          WHERE i.status = 'Completed'
        )::INTEGER AS completed_interviews,

        COUNT(*) FILTER (
          WHERE i.status = 'Cancelled'
        )::INTEGER AS cancelled_interviews

      FROM interviews i

      INNER JOIN applications a
        ON i.application_id = a.id

      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE j.user_id = $1
      `,
      [req.user.id]
    );

    /* ================================
       AI SCREENING
    ================================= */

    const aiResult = await pool.query(
      `
      SELECT
        COUNT(s.id)::INTEGER AS total_screenings,

        ROUND(
          COALESCE(
            AVG(s.match_score),
            0
          ),
          2
        ) AS average_match_score,

        COUNT(*) FILTER (
          WHERE s.match_score >= 85
        )::INTEGER AS strong_matches,

        COUNT(*) FILTER (
          WHERE s.match_score >= 70
            AND s.match_score < 85
        )::INTEGER AS good_matches,

        COUNT(*) FILTER (
          WHERE s.match_score < 70
        )::INTEGER AS review_matches

      FROM ai_screenings s

      INNER JOIN applications a
        ON s.application_id = a.id

      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE j.user_id = $1
      `,
      [req.user.id]
    );

    /* ================================
       TOP CANDIDATES
    ================================= */

    const topCandidatesResult = await pool.query(
      `
      SELECT
        a.id AS application_id,
        c.id AS candidate_id,
        c.name AS candidate_name,
        c.email AS candidate_email,
        j.title AS job_title,
        a.status,
        a.ai_match_score
      FROM applications a

      INNER JOIN candidates c
        ON a.candidate_id = c.id

      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE j.user_id = $1

      ORDER BY
        a.ai_match_score DESC NULLS LAST,
        a.applied_at DESC

      LIMIT 5
      `,
      [req.user.id]
    );

    /* ================================
       RECENT APPLICATION ACTIVITY
    ================================= */

    const recentApplicationsResult =
      await pool.query(
        `
        SELECT
          a.id,
          c.name AS candidate_name,
          j.title AS job_title,
          a.status,
          a.ai_match_score,
          a.applied_at
        FROM applications a

        INNER JOIN candidates c
          ON a.candidate_id = c.id

        INNER JOIN jobs j
          ON a.job_id = j.id

        WHERE j.user_id = $1

        ORDER BY a.applied_at DESC

        LIMIT 8
        `,
        [req.user.id]
      );

    /* ================================
       PIPELINE
    ================================= */

    const pipelineResult = await pool.query(
      `
      SELECT
        a.status,
        COUNT(*)::INTEGER AS count
      FROM applications a

      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE j.user_id = $1

      GROUP BY a.status

      ORDER BY count DESC
      `,
      [req.user.id]
    );

    /* ================================
       RESPONSE
    ================================= */

    return res.status(200).json({
      success: true,

      overview: {
        jobs: jobsResult.rows[0],
        candidates: candidatesResult.rows[0],
        applications:
          applicationsResult.rows[0],
        interviews:
          interviewsResult.rows[0],
        ai: aiResult.rows[0],
      },

      top_candidates:
        topCandidatesResult.rows,

      recent_applications:
        recentApplicationsResult.rows,

      pipeline:
        pipelineResult.rows,
    });
  } catch (error) {
    console.error(
      "Dashboard analytics error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching dashboard analytics",
    });
  }
};

/* =================================
   HIRING TRENDS
================================= */

const getHiringTrends = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        TO_CHAR(
          DATE_TRUNC('month', a.applied_at),
          'Mon YYYY'
        ) AS month,

        COUNT(*)::INTEGER AS applications,

        COUNT(*) FILTER (
          WHERE a.status = 'Selected'
        )::INTEGER AS selected,

        COUNT(*) FILTER (
          WHERE a.status = 'Rejected'
        )::INTEGER AS rejected

      FROM applications a

      INNER JOIN jobs j
        ON a.job_id = j.id

      WHERE j.user_id = $1

      GROUP BY DATE_TRUNC(
        'month',
        a.applied_at
      )

      ORDER BY DATE_TRUNC(
        'month',
        a.applied_at
      )
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      trends: result.rows,
    });
  } catch (error) {
    console.error(
      "Hiring trends error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching hiring trends",
    });
  }
};

module.exports = {
  getDashboardAnalytics,
  getHiringTrends,
};
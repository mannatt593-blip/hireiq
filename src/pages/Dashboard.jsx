import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Users,
  BriefcaseBusiness,
  FileText,
  CalendarDays,
  ArrowUpRight,
  Sparkles,
  BrainCircuit,
  Clock3,
  CheckCircle2,
  ChevronRight,
  Target,
  Zap,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import "./Dashboard.css";

const API_URL = "http://localhost:5000/api";

const getAuthToken = () => {
  return (
    localStorage.getItem("hireiq_token") ||
    localStorage.getItem("hireiqToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("hireiq_token") ||
    sessionStorage.getItem("token") ||
    ""
  );
};

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "Recently";

  const date = new Date(dateValue);
  const now = new Date();

  const diffMs = Math.max(0, now - date);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${Math.max(diffMinutes, 1)} min ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hr${diffHours !== 1 ? "s" : ""} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  const weeks = Math.floor(diffDays / 7);

  if (weeks < 5) {
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }

  const months = Math.floor(diffDays / 30);

  return `${months} month${months !== 1 ? "s" : ""} ago`;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

function Dashboard() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("Please sign in to view your dashboard.");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [analyticsResponse, interviewsResponse] =
        await Promise.all([
          fetch(`${API_URL}/analytics/dashboard`, {
            method: "GET",
            headers,
          }),
          fetch(`${API_URL}/interviews`, {
            method: "GET",
            headers,
          }),
        ]);

      const analyticsData = await analyticsResponse.json();
      const interviewsData = await interviewsResponse.json();

      if (!analyticsResponse.ok) {
        throw new Error(
          analyticsData.message ||
            "Unable to load dashboard analytics."
        );
      }

      if (!interviewsResponse.ok) {
        throw new Error(
          interviewsData.message ||
            "Unable to load interviews."
        );
      }

      setAnalytics(analyticsData);
      setInterviews(interviewsData.interviews || []);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError(
        err.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const overview = analytics?.overview;

  const jobs = overview?.jobs || {};
  const candidates = overview?.candidates || {};
  const applications = overview?.applications || {};
  const interviewStats = overview?.interviews || {};
  const ai = overview?.ai || {};

  const totalApplications =
    Number(applications.total_applications || 0);

  const selectedCandidates =
    Number(applications.selected_count || 0);

  const conversionToHire =
    totalApplications > 0
      ? ((selectedCandidates / totalApplications) * 100).toFixed(1)
      : "0.0";

  const averageMatchScore =
    Number(ai.average_match_score || 0);

  const confidenceScore = Math.round(
    Number(
      ai.average_match_score || 0
    )
  );

  const pipeline = useMemo(() => {
    const total = totalApplications;

    const screening =
      Number(applications.screening_count || 0);

    const shortlisted =
      Number(applications.shortlisted_count || 0);

    const interviewScheduled =
      Number(
        applications.interview_scheduled_count || 0
      );

    const hired =
      Number(applications.selected_count || 0);

    const getWidth = (value) => {
      if (!total) return "0%";

      return `${Math.max(
        6,
        Math.min(100, (value / total) * 100)
      )}%`;
    };

    return [
      {
        label: "Applied",
        value: total,
        width: total > 0 ? "100%" : "0%",
      },
      {
        label: "Screening",
        value: screening,
        width: getWidth(screening),
      },
      {
        label: "Shortlisted",
        value: shortlisted,
        width: getWidth(shortlisted),
      },
      {
        label: "Interview",
        value: interviewScheduled,
        width: getWidth(interviewScheduled),
      },
      {
        label: "Hired",
        value: hired,
        width: getWidth(hired),
      },
    ];
  }, [
    totalApplications,
    applications.screening_count,
    applications.shortlisted_count,
    applications.interview_scheduled_count,
    applications.selected_count,
  ]);

  const stats = [
    {
      title: "Total Candidates",
      value: Number(
        candidates.total_candidates || 0
      ).toLocaleString(),
      change: "Live",
      icon: Users,
      description: "from PostgreSQL",
    },
    {
      title: "Active Jobs",
      value: Number(
        jobs.active_jobs || 0
      ).toLocaleString(),
      change: "Live",
      icon: BriefcaseBusiness,
      description: "currently open",
    },
    {
      title: "Applications",
      value: totalApplications.toLocaleString(),
      change: "Live",
      icon: FileText,
      description: "across active jobs",
    },
    {
      title: "Interviews",
      value: Number(
        interviewStats.total_interviews || 0
      ).toLocaleString(),
      change: "Live",
      icon: CalendarDays,
      description: "scheduled & completed",
    },
  ];

  const upcomingInterviews = interviews
    .filter((item) => {
      if (!item.scheduled_at) return false;

      const date = new Date(item.scheduled_at);

      return (
        date >= new Date() &&
        item.status !== "Cancelled"
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduled_at) -
        new Date(b.scheduled_at)
    )
    .slice(0, 3);

  const recentActivities = (
    analytics?.recent_applications || []
  )
    .slice(0, 3)
    .map((item) => ({
      icon:
        item.status === "Interview Scheduled"
          ? CalendarDays
          : item.status === "Selected"
          ? CheckCircle2
          : item.ai_match_score >= 85
          ? Sparkles
          : UserCheck,

      title: `${item.candidate_name} — ${item.status}`,

      text: item.job_title || "Application update",

      time: formatTimeAgo(item.applied_at),
    }));

  const topCandidate =
    analytics?.top_candidates?.[0];

  const hiringGoalTarget = 80;

  const hiringGoalProgress =
    hiringGoalTarget > 0
      ? Math.min(
          100,
          (selectedCandidates /
            hiringGoalTarget) *
            100
        )
      : 0;

  const hiringEfficiency = Math.round(
    averageMatchScore
  );

  if (loading) {
    return (
      <div className="dashboard-page">
        <div
          style={{
            minHeight: "420px",
            display: "grid",
            placeItems: "center",
            color: "#759a91",
            fontSize: "12px",
          }}
        >
          Loading hiring intelligence...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            border:
              "1px solid rgba(220, 90, 90, .22)",
            background:
              "rgba(120, 35, 35, .12)",
            color: "#dba6a6",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">

      {/* HEADER */}

      <div className="dashboard-header">

        <div>
          <div className="dashboard-eyebrow">
            <span className="eyebrow-dot"></span>
            AI RECRUITMENT INTELLIGENCE
          </div>

          <h1>Dashboard</h1>

          <p>
            Your hiring intelligence overview for today.
          </p>
        </div>

        <button
          type="button"
          className="ai-insights-btn"
          onClick={() => navigate("/analytics")}
        >
          <Sparkles size={16} />
          AI Insights
          <ArrowUpRight size={14} />
        </button>

      </div>

      {/* STATS */}

      <div className="stats-grid">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="stat-card"
              key={stat.title}
            >

              <div className="stat-top">

                <div className="stat-icon">
                  <Icon size={18} />
                </div>

                <ArrowUpRight
                  size={15}
                  className="stat-arrow"
                />

              </div>

              <div className="stat-title">
                {stat.title}
              </div>

              <div className="stat-value-row">

                <strong>
                  {stat.value}
                </strong>

                <span className="stat-change">
                  {stat.change}
                </span>

              </div>

              <div className="stat-description">
                {stat.description}
              </div>

            </div>
          );
        })}

      </div>

      {/* MAIN GRID */}

      <div className="dashboard-main-grid">

        {/* PIPELINE */}

        <section className="dashboard-card pipeline-card">

          <div className="card-header">

            <div>
              <h2>Hiring Pipeline</h2>
              <p>
                Candidate movement across stages
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                navigate("/applications")
              }
            >
              View details
              <ArrowUpRight size={13} />
            </button>

          </div>

          <div className="pipeline-list">

            {pipeline.map((stage) => (
              <div
                className="pipeline-row"
                key={stage.label}
              >

                <div className="pipeline-label">
                  <span>{stage.label}</span>
                  <strong>{stage.value}</strong>
                </div>

                <div className="pipeline-track">

                  <div
                    className="pipeline-fill"
                    style={{
                      width: stage.width,
                    }}
                  />

                </div>

              </div>
            ))}

          </div>

          <div className="pipeline-footer">

            <div>
              <span>Conversion to hire</span>
              <strong>
                {conversionToHire}%
              </strong>
            </div>

            <div>
              <span>Avg. time to hire</span>
              <strong>—</strong>
            </div>

            <div>
              <span>Open positions</span>
              <strong>
                {Number(
                  jobs.active_jobs || 0
                )}
              </strong>
            </div>

          </div>

        </section>

        {/* AI SCREENING */}

        <section className="dashboard-card ai-screening-card">

          <div className="card-header">

            <div>
              <h2>
                <BrainCircuit size={19} />
                AI Screening
              </h2>

              <p>
                Automated candidate evaluation
              </p>
            </div>

            <span className="status-pill">
              <span></span>
              Active
            </span>

          </div>

          <div className="screening-content">

            <div
              className="score-ring"
              style={{
                "--screening-score":
                  `${averageMatchScore}%`,
              }}
            >
              <div className="score-inner">

                <strong>
                  {averageMatchScore}%
                </strong>

                <span>
                  Match
                </span>

              </div>
            </div>

            <div className="screening-stats">

              <div>
                <span>Screened</span>
                <strong>
                  {Number(
                    ai.total_screenings || 0
                  )}
                </strong>
              </div>

              <div>
                <span>High matches</span>
                <strong>
                  {Number(
                    ai.strong_matches || 0
                  )}
                </strong>
              </div>

              <div>
                <span>Avg. match</span>
                <strong>
                  {confidenceScore}%
                </strong>
              </div>

            </div>

          </div>

          <div className="ai-message">

            <Sparkles size={16} />

            <span>

              {Number(ai.strong_matches || 0) > 0 ? (
                <>
                  AI identified{" "}
                  <strong>
                    {Number(
                      ai.strong_matches || 0
                    )} strong matches
                  </strong>{" "}
                  across your hiring pipeline.
                </>
              ) : (
                <>
                  AI screening is ready for
                  incoming candidates.
                </>
              )}

            </span>

          </div>

        </section>

      </div>

      {/* SECOND ROW */}

      <div className="dashboard-lower-grid">

        {/* UPCOMING INTERVIEWS */}

        <section className="dashboard-card">

          <div className="card-header">

            <div>
              <h2>
                Upcoming Interviews
              </h2>

              <p>
                Your next scheduled interviews
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                navigate("/interviews")
              }
            >
              View all
              <ArrowUpRight size={13} />
            </button>

          </div>

          <div className="interview-list">

            {upcomingInterviews.length > 0 ? (
              upcomingInterviews.map(
                (interview) => (
                  <div
                    className="interview-item"
                    key={interview.id}
                  >

                    <div className="interview-avatar">
                      {getInitials(
                        interview.candidate_name
                      )}
                    </div>

                    <div className="interview-info">

                      <strong>
                        {interview.candidate_name}
                      </strong>

                      <span>
                        {interview.job_title}
                      </span>

                    </div>

                    <div className="interview-time">

                      <strong>
                        <Clock3 size={13} />

                        {new Date(
                          interview.scheduled_at
                        ).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </strong>

                      <span>
                        {interview.interview_type}
                      </span>

                    </div>

                    <button
                      className="round-arrow"
                      onClick={() =>
                        navigate("/interviews")
                      }
                    >
                      <ChevronRight
                        size={15}
                      />
                    </button>

                  </div>
                )
              )
            ) : (
              <div
                style={{
                  padding: "28px",
                  textAlign: "center",
                  color: "#759a91",
                  fontSize: "11px",
                }}
              >
                No upcoming interviews.
              </div>
            )}

          </div>

        </section>

        {/* HIRING SUMMARY */}

        <section className="dashboard-card summary-card">

          <div className="card-header">

            <div>
              <h2>
                Hiring Summary
              </h2>

              <p>
                Current hiring performance
              </p>
            </div>

            <TrendingUp size={18} />

          </div>

          <div className="summary-number">

            {selectedCandidates}

            <span>
              selected candidates
            </span>

          </div>

          <div className="summary-metrics">

            <div>
              <span>
                Interview scheduled
              </span>

              <strong>
                {Number(
                  applications.interview_scheduled_count ||
                    0
                )}
              </strong>
            </div>

            <div>
              <span>
                Avg. AI match
              </span>

              <strong>
                {averageMatchScore}%
              </strong>
            </div>

            <div>
              <span>
                Applications
              </span>

              <strong>
                {totalApplications}
              </strong>
            </div>

          </div>

          <div className="goal-progress">

            <div className="goal-header">

              <span>
                Monthly hiring goal
              </span>

              <strong>
                {selectedCandidates} /{" "}
                {hiringGoalTarget}
              </strong>

            </div>

            <div className="goal-track">

              <div
                className="goal-fill"
                style={{
                  width: `${hiringGoalProgress}%`,
                }}
              />

            </div>

            <span className="goal-caption">

              {Math.round(
                hiringGoalProgress
              )}
              % of the current hiring goal completed

            </span>

          </div>

        </section>

      </div>

      {/* AI COPILOT + ACTIVITY */}

      <div className="dashboard-bottom-grid">

        {/* AI COPILOT */}

        <section className="dashboard-card copilot-card">

          <div className="copilot-glow"></div>

          <div className="copilot-header">

            <div className="copilot-icon">
              <Sparkles size={20} />
            </div>

            <div>

              <h2>
                AI Recruiter Copilot
              </h2>

              <p>
                Your intelligent hiring assistant
              </p>

            </div>

            <span className="copilot-live">
              LIVE
            </span>

          </div>

          <div className="copilot-score">

            <div>
              <span>
                Hiring efficiency
              </span>

              <strong>
                {hiringEfficiency}%
              </strong>
            </div>

            <div className="copilot-trend">
              <TrendingUp size={14} />
              Live
            </div>

          </div>

          <div className="copilot-insight">

            <div className="insight-icon">
              <Zap size={16} />
            </div>

            <div>

              <strong>
                Recommended action
              </strong>

              <p>
                {Number(
                  ai.strong_matches || 0
                )} high-match candidates
                are currently available
                for recruiter review.
              </p>

            </div>

            <button
              onClick={() =>
                navigate("/candidates")
              }
            >
              Review
              <ChevronRight size={14} />
            </button>

          </div>

        </section>

        {/* RECENT ACTIVITY */}

        <section className="dashboard-card activity-card">

          <div className="card-header">

            <div>
              <h2>
                Recent Activity
              </h2>

              <p>
                Latest hiring actions
              </p>
            </div>

            <button
              className="text-btn"
              onClick={() =>
                navigate("/applications")
              }
            >
              View all
              <ArrowUpRight size={13} />
            </button>

          </div>

          <div className="activity-list">

            {recentActivities.length > 0 ? (
              recentActivities.map(
                (activity, index) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      className="activity-item"
                      key={`${activity.title}-${index}`}
                    >

                      <div className="activity-icon">
                        <Icon size={15} />
                      </div>

                      <div className="activity-info">

                        <strong>
                          {activity.title}
                        </strong>

                        <span>
                          {activity.text}
                        </span>

                      </div>

                      <time>
                        {activity.time}
                      </time>

                    </div>
                  );
                }
              )
            ) : (
              <div
                style={{
                  padding: "28px",
                  textAlign: "center",
                  color: "#759a91",
                  fontSize: "11px",
                }}
              >
                No recent activity.
              </div>
            )}

          </div>

        </section>

      </div>

      {/* QUICK INSIGHTS */}

      <div className="quick-insights">

        <div className="quick-insight-item">

          <Target size={17} />

          <div>
            <strong>
              Hiring Goal
            </strong>

            <span>
              Current progress
            </span>
          </div>

          <strong>
            {selectedCandidates} /{" "}
            {hiringGoalTarget}
          </strong>

        </div>

        <div className="quick-insight-item">

          <Users size={17} />

          <div>
            <strong>
              Top Talent Match
            </strong>

            <span>
              {topCandidate?.job_title ||
                "No ranked candidates yet"}
            </span>
          </div>

          <strong>
            {topCandidate?.ai_match_score != null
              ? `${Number(
                  topCandidate.ai_match_score
                ).toFixed(0)}%`
              : "—"}
          </strong>

        </div>

        <div className="quick-insight-item">

          <Zap size={17} />

          <div>
            <strong>
              AI Automation
            </strong>

            <span>
              Candidates screened
            </span>
          </div>

          <strong>
            {Number(
              ai.total_screenings || 0
            )}
          </strong>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;
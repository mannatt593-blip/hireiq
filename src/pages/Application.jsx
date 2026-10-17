 import {
  FileText,
  Users,
  Sparkles,
  CalendarDays,
  Search,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "./Application.css";

import { API_URL, apiFetch } from "../services/api";

/* =========================================================
   AUTH
========================================================= */

import { getAuthToken } from "../services/auth";

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (name = "") => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "NA";

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getCandidateId = (name = "") =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const formatApplied = (dateValue) => {
  if (!dateValue) return "Recently";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();

  const diffMs = Math.max(
    0,
    now.getTime() - date.getTime()
  );

  const minutes = Math.floor(
    diffMs / (1000 * 60)
  );

  const hours = Math.floor(
    diffMs / (1000 * 60 * 60)
  );

  const days = Math.floor(
    diffMs / (1000 * 60 * 60 * 24)
  );

  if (minutes < 60) {
    return `${Math.max(
      1,
      minutes
    )} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr${
      hours !== 1 ? "s" : ""
    } ago`;
  }

  if (days < 7) {
    return `${days} day${
      days !== 1 ? "s" : ""
    } ago`;
  }

  if (days < 30) {
    const weeks = Math.floor(
      days / 7
    );

    return `${weeks} week${
      weeks !== 1 ? "s" : ""
    } ago`;
  }

  const months = Math.floor(
    days / 30
  );

  return `${months} month${
    months !== 1 ? "s" : ""
  } ago`;
};

const normalizeStatus = (status) => {
  if (!status) {
    return "Screening";
  }

  if (status === "Interview Scheduled") {
    return "Interview";
  }

  if (status === "Applied") {
    return "Screening";
  }

  return status;
};

const normalizeApplication = (item) => {
  const match = Number(
    item.ai_match_score || 0
  );

  return {
    id: item.id,

    candidateId:
      item.candidate_id,

    name:
      item.candidate_name ||
      "Unknown Candidate",

    initials: getInitials(
      item.candidate_name
    ),

    location:
      item.candidate_location ||
      "Remote",

    position:
      item.job_title ||
      "Unknown Position",

    type: "Full-time",

    experience:
      item.experience_years != null
        ? `${Number(
            item.experience_years
          )} yrs`
        : "0 yrs",

    match,

    status: normalizeStatus(
      item.status
    ),

    backendStatus:
      item.status,

    applied: formatApplied(
      item.applied_at
    ),

    appliedAt:
      item.applied_at,

    email:
      item.candidate_email || "",

    phone:
      item.candidate_phone || "",

    skills:
      typeof item.skills === "string"
        ? item.skills
            .split(",")
            .map((skill) =>
              skill.trim()
            )
            .filter(Boolean)
        : Array.isArray(item.skills)
        ? item.skills
        : [],
  };
};

/* =========================================================
   APPLICATIONS
========================================================= */

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("Recent");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     LOAD APPLICATIONS
  ======================================================= */

  const fetchApplications =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const token = getAuthToken();

        if (!token) {
          throw new Error(
            "Please sign in to view applications."
          );
        }

        const response = await apiFetch(
          `${API_URL}/applications`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load applications."
          );
        }

        setApplications(
          (data.applications || []).map(
            normalizeApplication
          )
        );
      } catch (err) {
        console.error(
          "Applications loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load applications."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  /* =======================================================
     REFRESH WHEN PAGE BECOMES VISIBLE
  ======================================================= */

  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        fetchApplications();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [fetchApplications]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const total =
      applications.length;

    const highMatches =
      applications.filter(
        (application) =>
          Number(application.match) >= 85
      ).length;

    const shortlisted =
      applications.filter(
        (application) =>
          application.status ===
          "Shortlisted"
      ).length;

    const interviewCandidates =
      applications.filter(
        (application) =>
          application.status ===
          "Interview"
      ).length;

    const screening =
      applications.filter(
        (application) =>
          application.status ===
          "Screening"
      ).length;

    const rejected =
      applications.filter(
        (application) =>
          application.status ===
          "Rejected"
      ).length;

    const selected =
      applications.filter(
        (application) =>
          application.backendStatus ===
          "Selected"
      ).length;

    const averageMatch =
      total > 0
        ? Math.round(
            applications.reduce(
              (sum, application) =>
                sum +
                Number(
                  application.match || 0
                ),
              0
            ) / total
          )
        : 0;

    return {
      total,
      highMatches,
      shortlisted,
      interviewCandidates,
      screening,
      rejected,
      selected,
      averageMatch,
    };
  }, [applications]);

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const filteredApplications =
    useMemo(() => {
      let result = [
        ...applications,
      ];

      const searchText =
        search
          .toLowerCase()
          .trim();

      if (searchText) {
        result =
          result.filter(
            (application) =>
              application.name
                .toLowerCase()
                .includes(searchText) ||
              application.position
                .toLowerCase()
                .includes(searchText) ||
              application.location
                .toLowerCase()
                .includes(searchText) ||
              application.skills.some(
                (skill) =>
                  skill
                    .toLowerCase()
                    .includes(searchText)
              )
          );
      }

      if (
        statusFilter !== "All"
      ) {
        result =
          result.filter(
            (application) =>
              application.status ===
              statusFilter
          );
      }

      if (
        sortBy ===
        "Highest AI Match"
      ) {
        result.sort(
          (a, b) =>
            Number(b.match) -
            Number(a.match)
        );
      }

      if (
        sortBy ===
        "Lowest AI Match"
      ) {
        result.sort(
          (a, b) =>
            Number(a.match) -
            Number(b.match)
        );
      }

      if (sortBy === "Recent") {
        result.sort(
          (a, b) =>
            new Date(
              b.appliedAt || 0
            ).getTime() -
            new Date(
              a.appliedAt || 0
            ).getTime()
        );
      }

      return result;
    }, [
      applications,
      search,
      statusFilter,
      sortBy,
    ]);

  /* =======================================================
     AI REVIEW
  ======================================================= */

  const handleAIReview = () => {
    setStatusFilter("All");
    setSortBy("Highest AI Match");

    setTimeout(() => {
      document
        .querySelector(
          ".applications-section"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  };

  /* =======================================================
     PIPELINE
  ======================================================= */

  const pipeline =
    useMemo(() => {
      const total =
        applications.length;

      const safeTotal =
        Math.max(total, 1);

      const getWidth = (value) => {
        if (!total) return "0%";

        return `${Math.min(
          100,
          Math.max(
            4,
            (value / total) * 100
          )
        )}%`;
      };

      return {
        applied: {
          value: total,
          width:
            total > 0
              ? "100%"
              : "0%",
        },

        screening: {
          value:
            stats.screening,
          width:
            getWidth(
              stats.screening
            ),
        },

        shortlisted: {
          value:
            stats.shortlisted,
          width:
            getWidth(
              stats.shortlisted
            ),
        },

        interview: {
          value:
            stats.interviewCandidates,
          width:
            getWidth(
              stats.interviewCandidates
            ),
        },

        hired: {
          value:
            stats.selected,
          width:
            getWidth(
              stats.selected
            ),
        },
      };
    }, [
      applications.length,
      stats,
    ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="applications-page">
        <div
          style={{
            minHeight: "420px",
            display: "grid",
            placeItems: "center",
            color: "#759a91",
            fontSize: "11px",
          }}
        >
          Loading application intelligence...
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="applications-page">
        <div
          style={{
            padding: "16px",
            borderRadius: "10px",
            border:
              "1px solid rgba(220,90,90,.22)",
            background:
              "rgba(120,35,35,.12)",
            color: "#dba6a6",
            fontSize: "11px",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="applications-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="applications-header">

        <div>

          <div className="applications-eyebrow">
            <span></span>
            APPLICATION MANAGEMENT
          </div>

          <h1>
            Applications
          </h1>

          <p>
            Review, evaluate and manage
            candidate applications.
          </p>

        </div>

        <button
          className="ai-review-btn"
          onClick={
            handleAIReview
          }
        >
          <Sparkles size={15} />

          AI Review

          <ArrowUpRight
            size={13}
          />
        </button>

      </div>

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="applications-stats">

        <div className="application-stat-card">

          <div className="application-stat-icon">
            <FileText size={18} />
          </div>

          <div>

            <span>
              Total Applications
            </span>

            <strong>
              {stats.total}
            </strong>

            <small>
              Live from PostgreSQL
            </small>

          </div>

        </div>

        <div className="application-stat-card">

          <div className="application-stat-icon">
            <Sparkles size={18} />
          </div>

          <div>

            <span>
              AI Matches
            </span>

            <strong>
              {stats.highMatches}
            </strong>

            <small>
              Above 85% match
            </small>

          </div>

        </div>

        <div className="application-stat-card">

          <div className="application-stat-icon">
            <Users size={18} />
          </div>

          <div>

            <span>
              Shortlisted
            </span>

            <strong>
              {stats.shortlisted}
            </strong>

            <small>
              Active candidates
            </small>

          </div>

        </div>

        <div className="application-stat-card">

          <div className="application-stat-icon">
            <CalendarDays size={18} />
          </div>

          <div>

            <span>
              Interviews
            </span>

            <strong>
              {stats.interviewCandidates}
            </strong>

            <small>
              Interview-stage applications
            </small>

          </div>

        </div>

      </div>

      {/* ===================================================
          AI INSIGHT
      =================================================== */}

      <section className="application-ai-banner">

        <div className="application-ai-icon">
          <Sparkles size={19} />
        </div>

        <div className="application-ai-content">

          <div>

            <strong>
              AI Application Insight
            </strong>

            <span>
              LIVE INSIGHT
            </span>

          </div>

          <p>
            AI identified{" "}
            <b>
              {stats.highMatches} high-match
              candidates
            </b>{" "}
            in the current application
            pool. Their match score is
            above 85%.
          </p>

        </div>

        <button
          onClick={
            handleAIReview
          }
        >
          Review matches

          <ArrowUpRight
            size={13}
          />

        </button>

      </section>

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="applications-main-grid">

        {/* =================================================
            PIPELINE
        ================================================= */}

        <section className="applications-card">

          <div className="applications-card-header">

            <div>

              <h2>
                Application Pipeline
              </h2>

              <p>
                Candidate movement across
                hiring stages
              </p>

            </div>

            <button
              className="applications-text-btn"
              onClick={() => {
                setStatusFilter(
                  "All"
                );

                setSortBy(
                  "Recent"
                );

                document
                  .querySelector(
                    ".applications-section"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  });
              }}
            >

              View details

              <ArrowUpRight
                size={12}
              />

            </button>

          </div>

          <div className="application-pipeline">

            <PipelineRow
              label="Applied"
              value={
                pipeline
                  .applied.value
              }
              width={
                pipeline
                  .applied.width
              }
            />

            <PipelineRow
              label="Screening"
              value={
                pipeline
                  .screening.value
              }
              width={
                pipeline
                  .screening.width
              }
            />

            <PipelineRow
              label="Shortlisted"
              value={
                pipeline
                  .shortlisted.value
              }
              width={
                pipeline
                  .shortlisted.width
              }
            />

            <PipelineRow
              label="Interview"
              value={
                pipeline
                  .interview.value
              }
              width={
                pipeline
                  .interview.width
              }
            />

            <PipelineRow
              label="Hired"
              value={
                pipeline
                  .hired.value
              }
              width={
                pipeline
                  .hired.width
              }
            />

          </div>

        </section>

        {/* =================================================
            AI SUMMARY
        ================================================= */}

        <section className="applications-card">

          <div className="applications-card-header">

            <div>

              <h2>

                <Sparkles size={16} />

                AI Evaluation

              </h2>

              <p>
                Application intelligence
              </p>

            </div>

            <span className="ai-active-pill">

              <span></span>

              Active

            </span>

          </div>

          <div className="ai-summary-number">

            <strong>
              {stats.averageMatch}%
            </strong>

            <span>
              average match
            </span>

          </div>

          <div className="ai-summary-metrics">

            <div>

              <span>
                High matches
              </span>

              <strong>
                {stats.highMatches}
              </strong>

            </div>

            <div>

              <span>
                Selected
              </span>

              <strong>
                {stats.selected}
              </strong>

            </div>

            <div>

              <span>
                Confidence
              </span>

              <strong>
                {stats.averageMatch}%
              </strong>

            </div>

          </div>

          <div className="ai-summary-message">

            <Sparkles size={14} />

            <span>

              AI recommends reviewing{" "}

              <strong>
                {Math.min(
                  Math.max(
                    stats.highMatches,
                    1
                  ),
                  12
                )}{" "}
                candidates
              </strong>{" "}

              first.

            </span>

          </div>

        </section>

      </div>

      {/* ===================================================
          APPLICATION TABLE
      =================================================== */}

      <section className="applications-section">

        <div className="applications-section-header">

          <div>

            <h2>
              Recent Applications
            </h2>

            <p>
              Review and manage incoming
              candidates
            </p>

          </div>

          <div className="applications-controls">

            {/* SEARCH */}

            <div className="applications-search">

              <Search size={14} />

              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />

            </div>

            {/* STATUS */}

            <select
              className="applications-filter-btn"
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >

              <option value="All">
                All Status
              </option>

              <option value="Screening">
                Screening
              </option>

              <option value="Shortlisted">
                Shortlisted
              </option>

              <option value="Interview">
                Interview
              </option>

              <option value="Rejected">
                Rejected
              </option>

            </select>

            {/* SORT */}

            <select
              className="applications-sort-btn"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
            >

              <option value="Recent">
                Recent
              </option>

              <option value="Highest AI Match">
                Highest AI Match
              </option>

              <option value="Lowest AI Match">
                Lowest AI Match
              </option>

            </select>

          </div>

        </div>

        {/* =================================================
            TABLE HEADER
        ================================================= */}

        <div className="applications-table-header">

          <span>
            Candidate
          </span>

          <span>
            Applied For
          </span>

          <span>
            Experience
          </span>

          <span>
            AI Match
          </span>

          <span>
            Status
          </span>

          <span>
            Applied
          </span>

          <span></span>

        </div>

        {/* =================================================
            TABLE BODY
        ================================================= */}

        <div className="applications-table-body">

          {filteredApplications.length >
          0 ? (
            filteredApplications.map(
              (application) => (
                <ApplicationRow
                  key={
                    application.id ||
                    `${application.name}-${application.position}`
                  }
                  application={
                    application
                  }
                  navigate={
                    navigate
                  }
                />
              )
            )
          ) : (
            <div className="applications-empty-state">

              <Search size={20} />

              <strong>
                No applications found
              </strong>

              <span>
                Try changing your search
                or filter.
              </span>

            </div>
          )}

        </div>

      </section>

      {/* ===================================================
          BOTTOM INSIGHTS
      =================================================== */}

      <div className="application-bottom-insights">

        <div>

          <CheckCircle2 size={16} />

          <span>

            <strong>
              {stats.total > 0
                ? Math.round(
                    ((stats.total -
                      stats.rejected) /
                      stats.total) *
                      100
                  )
                : 0}
              %
            </strong>

            Active applications

          </span>

          <b>
            {stats.total}
          </b>

        </div>

        <div>

          <Clock3 size={16} />

          <span>

            <strong>
              {stats.screening}
            </strong>

            Currently screening

          </span>

          <b>
            LIVE
          </b>

        </div>

        <div>

          <Sparkles size={16} />

          <span>

            <strong>
              {stats.averageMatch}%
            </strong>

            Average AI score

          </span>

          <b>
            AI
          </b>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   PIPELINE ROW
========================================================= */

function PipelineRow({
  label,
  value,
  width,
}) {
  return (
    <div className="application-pipeline-row">

      <div className="application-pipeline-label">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

      <div className="application-pipeline-track">

        <div
          className="application-pipeline-fill"
          style={{
            width:
              width || "0%",
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   APPLICATION ROW
========================================================= */

function ApplicationRow({
  application,
  navigate,
}) {
  const statusClass =
    application.status
      .toLowerCase()
      .replace(/\s+/g, "-");

  const handleOpenCandidate = () => {
    const candidateId =
      application.candidateId ||
      getCandidateId(
        application.name
      );

    /*
      Existing application route.
      CandidateDetails can use application state
      if needed.
    */

    navigate(
      `/applications/${candidateId}`,
      {
        state: {
          application,
          candidate: {
            id: candidateId,
            name: application.name,
            email: application.email,
            phone: application.phone,
            location:
              application.location,
            role:
              application.position,
            experience:
              application.experience,
            match:
              application.match,
            status:
              application.status,
            skills:
              application.skills,
          },
        },
      }
    );
  };

  return (
    <div className="application-row">

      {/* CANDIDATE */}

      <div className="application-candidate">

        <div className="application-avatar">
          {application.initials}
        </div>

        <div>

          <strong>
            {application.name}
          </strong>

          <span>
            <span>⌖</span>
            {application.location}
          </span>

        </div>

      </div>

      {/* ROLE */}

      <div className="application-role">

        <strong>
          {application.position}
        </strong>

        <span>
          {application.type}
        </span>

      </div>

      {/* EXPERIENCE */}

      <div className="application-experience">

        <Clock3 size={12} />

        {application.experience}

      </div>

      {/* AI MATCH */}

      <div className="application-match">

        <div>

          <Sparkles size={12} />

          <strong>
            {Number(
              application.match
            ).toFixed(0)}
            %
          </strong>

        </div>

        <div className="application-match-track">

          <div
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  Number(
                    application.match
                  )
                )
              )}%`,
            }}
          />

        </div>

      </div>

      {/* STATUS */}

      <div>

        <span
          className={`application-status ${statusClass}`}
        >

          {application.status ===
            "Shortlisted" && (
            <CheckCircle2
              size={10}
            />
          )}

          {application.status ===
            "Interview" && (
            <CalendarDays
              size={10}
            />
          )}

          {application.status ===
            "Rejected" && (
            <XCircle
              size={10}
            />
          )}

          {application.status ===
            "Screening" && (
            <Clock3
              size={10}
            />
          )}

          {application.status}

        </span>

      </div>

      {/* DATE */}

      <span className="application-date">
        {application.applied}
      </span>

      {/* OPEN */}

      <button
        className="application-more-btn"
        aria-label={`Open ${application.name}`}
        onClick={
          handleOpenCandidate
        }
      >
        <ArrowUpRight
          size={14}
        />
      </button>

    </div>
  );
}

export default Applications;
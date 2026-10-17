import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Plus,
  BriefcaseBusiness,
  Users,
  Clock3,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  MapPin,
  ChevronDown,
  Filter,
  TrendingUp,
  X,
} from "lucide-react";

import "./Jobs.css";

import { API_URL, apiFetch } from "../services/api";

import { getAuthToken } from "../services/auth";

const formatPostedTime = (dateValue) => {
  if (!dateValue) return "Recently";

  const createdDate = new Date(dateValue);
  const now = new Date();

  const diffMs = now - createdDate;
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

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  }

  const months = Math.floor(diffDays / 30);
  return `${months} month${months !== 1 ? "s" : ""} ago`;
};

const normalizeJob = (job) => {
  return {
    id: job.id,
    title: job.title || "Untitled Job",
    department: job.department || "General",
    location: job.location || "Remote",
    type: job.employment_type || "Full-time",
    experienceLevel: job.experience_level || "Not specified",
    applicants: Number(job.applications_count || 0),
    screened: null,
    shortlisted: null,
    match: null,
    posted: formatPostedTime(job.created_at),
    status: job.status || "Active",
    description: job.description || "",
    requirements: job.requirements || "",
    salaryMin: job.salary_min ?? "",
    salaryMax: job.salary_max ?? "",
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
};

const initialForm = {
  title: "",
  department: "",
  location: "",
  employment_type: "Full-time",
  experience_level: "",
  description: "",
  requirements: "",
  salary_min: "",
  salary_max: "",
  status: "Active",
};

function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recent");
  const [sortOpen, setSortOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  /* =================================
     FETCH JOBS
  ================================= */

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        setJobs([]);
        setError("Please sign in to load your jobs.");
        return;
      }

      const response = await apiFetch(`${API_URL}/jobs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch jobs");
      }

      setJobs((data.jobs || []).map(normalizeJob));
    } catch (err) {
      console.error("Fetch jobs error:", err);
      setError(err.message || "Unable to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /* =================================
     STATS
  ================================= */

  const activeJobsCount = jobs.filter(
    (job) => job.status === "Active"
  ).length;

  const totalApplicants = jobs.reduce(
    (total, job) => total + job.applicants,
    0
  );

  /* =================================
     SEARCH / FILTER / SORT
  ================================= */

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(search) ||
          job.department.toLowerCase().includes(search) ||
          job.location.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (job) => job.status === statusFilter
      );
    }

    if (sortBy === "Applicants") {
      result.sort((a, b) => b.applicants - a.applicants);
    }

    if (sortBy === "AI Match") {
      result.sort(
        (a, b) =>
          Number(b.match || 0) - Number(a.match || 0)
      );
    }

    if (sortBy === "Shortlisted") {
      result.sort(
        (a, b) =>
          Number(b.shortlisted || 0) -
          Number(a.shortlisted || 0)
      );
    }

    if (sortBy === "Recent") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
    }

    return result;
  }, [jobs, searchTerm, statusFilter, sortBy]);

  /* =================================
     CREATE JOB
  ================================= */

  const handleCreateJob = () => {
    setForm(initialForm);
    setError("");
    setCreateModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitCreateJob = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error(
          "Please sign in before creating a job."
        );
      }

      if (!form.title.trim()) {
        throw new Error("Job title is required.");
      }

      const response = await apiFetch(`${API_URL}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          department: form.department.trim(),
          location: form.location.trim(),
          employment_type: form.employment_type,
          experience_level: form.experience_level.trim(),
          description: form.description.trim(),
          requirements: form.requirements.trim(),
          salary_min:
            form.salary_min === ""
              ? null
              : Number(form.salary_min),
          salary_max:
            form.salary_max === ""
              ? null
              : Number(form.salary_max),
          status: form.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create job"
        );
      }

      setCreateModalOpen(false);
      setForm(initialForm);

      await fetchJobs();
    } catch (err) {
      console.error("Create job error:", err);
      setError(err.message || "Unable to create job");
    } finally {
      setCreating(false);
    }
  };

  /* =================================
     AI RECOMMENDATION → CANDIDATES
  ================================= */

  const handleReviewCandidates = () => {
    const selectedJob = jobs.find(
      (job) => job.status === "Active"
    );

    navigate("/candidates", {
      state: {
        selectedJob: selectedJob?.title || "",
        selectedJobId: selectedJob?.id || "",
        aiReview: true,
      },
    });
  };

  /* =================================
     JOB → CANDIDATES
  ================================= */

  const handleJobOpen = (job) => {
    navigate("/candidates", {
      state: {
        selectedJob: job.title,
        selectedJobId: job.id,
      },
    });
  };

  /* =================================
     RENDER
  ================================= */

  return (
    <div className="jobs-page">

      {/* ================= HEADER ================= */}

      <div className="jobs-header">

        <div>
          <div className="jobs-eyebrow">
            <span></span>
            TALENT ACQUISITION
          </div>

          <h1>Jobs</h1>

          <p>
            Manage your open positions and hiring pipelines.
          </p>
        </div>

        <button
          className="create-job-btn"
          onClick={handleCreateJob}
        >
          <Plus size={16} />
          Create Job
        </button>

      </div>

      {/* ================= ERROR ================= */}

      {error && (
        <div
          style={{
            marginBottom: "14px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(220, 90, 90, .25)",
            background: "rgba(120, 35, 35, .12)",
            color: "#dba6a6",
            fontSize: "11px",
          }}
        >
          {error}
        </div>
      )}

      {/* ================= STATS ================= */}

      <div className="jobs-stats">

        <div className="job-stat-card">
          <div className="job-stat-icon">
            <BriefcaseBusiness size={18} />
          </div>

          <div className="job-stat-content">
            <span>Active Jobs</span>
            <strong>{activeJobsCount}</strong>

            <small>
              <TrendingUp size={11} />
              Live from database
            </small>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon">
            <Users size={18} />
          </div>

          <div className="job-stat-content">
            <span>Total Applicants</span>
            <strong>{totalApplicants}</strong>

            <small>
              Across current jobs
            </small>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon">
            <Sparkles size={18} />
          </div>

          <div className="job-stat-content">
            <span>AI Matches</span>
            <strong>—</strong>

            <small>
              AI screening coming next
            </small>
          </div>
        </div>

        <div className="job-stat-card">
          <div className="job-stat-icon">
            <Clock3 size={18} />
          </div>

          <div className="job-stat-content">
            <span>Avg. Time to Hire</span>
            <strong>—</strong>

            <small>
              Analytics module coming next
            </small>
          </div>
        </div>

      </div>

      {/* ================= AI RECOMMENDATION ================= */}

      {jobs.length > 0 && (
        <section className="ai-job-banner">

          <div className="ai-job-banner-icon">
            <Sparkles size={19} />
          </div>

          <div className="ai-job-banner-content">

            <div>
              <strong>AI Hiring Recommendation</strong>

              <span className="ai-banner-pill">
                Smart insight
              </span>
            </div>

            <p>
              <strong>
                {jobs[0]?.title || "Your active job"}
              </strong>{" "}
              is now connected to your live hiring pipeline.
              AI candidate scoring will appear here after the
              screening module is connected.
            </p>

          </div>

          <button onClick={handleReviewCandidates}>
            Review candidates
            <ArrowUpRight size={14} />
          </button>

        </section>
      )}

      {/* ================= JOBS SECTION ================= */}

      <section className="jobs-section">

        <div className="jobs-section-header">

          <div>
            <h2>Open Positions</h2>

            <p>
              All your current hiring opportunities
            </p>
          </div>

          <div className="jobs-actions">

            {/* SEARCH */}

            <div className="jobs-search">

              <Search size={16} />

              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />

            </div>

            {/* FILTER */}

            <div style={{ position: "relative" }}>

              <button
                className="filter-btn"
                onClick={() =>
                  setFilterOpen(!filterOpen)
                }
              >
                <Filter size={14} />
                Filter
              </button>

              {filterOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "36px",
                    right: 0,
                    zIndex: 20,
                    minWidth: "120px",
                    padding: "6px",
                    border:
                      "1px solid rgba(104,168,150,.2)",
                    borderRadius: "8px",
                    background: "#103d35",
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,.3)",
                  }}
                >

                  {["All", "Active", "Closing Soon"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setFilterOpen(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: 0,
                          borderRadius: "5px",
                          background:
                            statusFilter === status
                              ? "rgba(118,205,176,.12)"
                              : "transparent",
                          color: "#b8ead8",
                          textAlign: "left",
                          fontSize: "9px",
                          cursor: "pointer",
                        }}
                      >
                        {status}
                      </button>
                    )
                  )}

                </div>
              )}

            </div>

            {/* SORT */}

            <div style={{ position: "relative" }}>

              <button
                className="sort-btn"
                onClick={() =>
                  setSortOpen(!sortOpen)
                }
              >
                {sortBy}
                <ChevronDown size={14} />
              </button>

              {sortOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "36px",
                    right: 0,
                    zIndex: 20,
                    minWidth: "120px",
                    padding: "6px",
                    border:
                      "1px solid rgba(104,168,150,.2)",
                    borderRadius: "8px",
                    background: "#103d35",
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,.3)",
                  }}
                >

                  {[
                    "Recent",
                    "Applicants",
                    "AI Match",
                    "Shortlisted",
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setSortOpen(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: 0,
                        borderRadius: "5px",
                        background:
                          sortBy === option
                            ? "rgba(118,205,176,.12)"
                            : "transparent",
                        color: "#b8ead8",
                        textAlign: "left",
                        fontSize: "9px",
                        cursor: "pointer",
                      }}
                    >
                      {option}
                    </button>
                  ))}

                </div>
              )}

            </div>

          </div>

        </div>

        {/* ================= JOB LIST ================= */}

        <div className="jobs-list">

          {loading ? (

            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#759a91",
                fontSize: "11px",
              }}
            >
              Loading jobs...
            </div>

          ) : filteredJobs.length > 0 ? (

            filteredJobs.map((job) => (

              <div
                className="job-row"
                key={job.id}
              >

                {/* JOB INFO */}

                <div className="job-main">

                  <div className="job-icon">
                    <BriefcaseBusiness size={17} />
                  </div>

                  <div className="job-info">

                    <div className="job-title-row">

                      <h3>{job.title}</h3>

                      <span
                        className={
                          job.status === "Closing Soon"
                            ? "job-status closing"
                            : "job-status"
                        }
                      >
                        <span></span>
                        {job.status}
                      </span>

                    </div>

                    <div className="job-meta">

                      <span>
                        {job.department}
                      </span>

                      <span className="meta-divider">
                        •
                      </span>

                      <span>
                        <MapPin size={11} />
                        {job.location}
                      </span>

                      <span className="meta-divider">
                        •
                      </span>

                      <span>
                        {job.type}
                      </span>

                    </div>

                  </div>

                </div>

                {/* APPLICANTS */}

                <div className="job-metric">
                  <span>Applicants</span>
                  <strong>{job.applicants}</strong>
                </div>

                {/* SCREENED */}

                <div className="job-metric">
                  <span>Screened</span>
                  <strong>
                    {job.screened ?? "—"}
                  </strong>
                </div>

                {/* SHORTLISTED */}

                <div className="job-metric">
                  <span>Shortlisted</span>
                  <strong>
                    {job.shortlisted ?? "—"}
                  </strong>
                </div>

                {/* AI MATCH */}

                <div className="job-match">

                  <div className="match-label">
                    <Sparkles size={12} />
                    AI Match
                  </div>

                  <strong>
                    {job.match ? `${job.match}%` : "—"}
                  </strong>

                  {job.match ? (
                    <div className="match-track">
                      <div
                        className="match-fill"
                        style={{
                          width: `${job.match}%`,
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="match-track"
                      style={{
                        opacity: 0.3,
                      }}
                    />
                  )}

                </div>

                {/* POSTED */}

                <div className="job-posted">

                  <span>Posted</span>

                  <strong>
                    {job.posted}
                  </strong>

                </div>

                {/* OPEN JOB → CANDIDATES */}

                <button
                  type="button"
                  className="job-arrow"
                  onClick={() => handleJobOpen(job)}
                >
                  <ArrowUpRight size={15} />
                </button>

                {/* MORE */}

                <button
                  type="button"
                  className="job-more"
                  onClick={() =>
                    alert(
                      `${job.title} — More actions will be connected with job management.`
                    )
                  }
                >
                  <MoreHorizontal size={17} />
                </button>

              </div>

            ))

          ) : (

            <div
              style={{
                padding: "35px",
                textAlign: "center",
                color: "#759a91",
                fontSize: "11px",
              }}
            >
              No jobs found.
            </div>

          )}

        </div>

      </section>

      {/* ================= CREATE JOB MODAL ================= */}

      {createModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.62)",
            backdropFilter: "blur(8px)",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCreateModalOpen(false);
            }
          }}
        >

          <div
            style={{
              width: "min(620px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              borderRadius: "18px",
              border:
                "1px solid rgba(142,182,155,.16)",
              background: "#0B2B26",
              boxShadow:
                "0 24px 80px rgba(0,0,0,.45)",
            }}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#8EB69B",
                    fontSize: "9px",
                    letterSpacing: "1.5px",
                    marginBottom: "6px",
                  }}
                >
                  NEW OPPORTUNITY
                </div>

                <h2
                  style={{
                    margin: 0,
                    color: "#DAF1DE",
                    fontSize: "22px",
                  }}
                >
                  Create Job
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCreateModalOpen(false)
                }
                style={{
                  width: "34px",
                  height: "34px",
                  border: 0,
                  borderRadius: "9px",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  background:
                    "rgba(142,182,155,.08)",
                  color: "#8EB69B",
                }}
              >
                <X size={17} />
              </button>

            </div>

            <form onSubmit={submitCreateJob}>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >

                <div
                  style={{
                    gridColumn: "1 / -1",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      color: "#8EB69B",
                      fontSize: "10px",
                    }}
                  >
                    Job title *
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g. Senior Frontend Developer"
                    required
                    style={modalInputStyle}
                  />
                </div>

                <div>
                  <label style={modalLabelStyle}>
                    Department
                  </label>

                  <input
                    name="department"
                    value={form.department}
                    onChange={handleFormChange}
                    placeholder="Engineering"
                    style={modalInputStyle}
                  />
                </div>

                <div>
                  <label style={modalLabelStyle}>
                    Location
                  </label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="Bangalore / Remote"
                    style={modalInputStyle}
                  />
                </div>

                <div>
                  <label style={modalLabelStyle}>
                    Employment type
                  </label>

                  <select
                    name="employment_type"
                    value={form.employment_type}
                    onChange={handleFormChange}
                    style={modalInputStyle}
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                    <option>Freelance</option>
                  </select>
                </div>

                <div>
                  <label style={modalLabelStyle}>
                    Experience level
                  </label>

                  <input
                    name="experience_level"
                    value={form.experience_level}
                    onChange={handleFormChange}
                    placeholder="3-5 Years"
                    style={modalInputStyle}
                  />
                </div>

                <div>
                  <label style={modalLabelStyle}>
                    Salary minimum
                  </label>

                  <input
                    type="number"
                    name="salary_min"
                    value={form.salary_min}
                    onChange={handleFormChange}
                    placeholder="800000"
                    min="0"
                    style={modalInputStyle}
                  />
                </div>

                <div>
                  <label style={modalLabelStyle}>
                    Salary maximum
                  </label>

                  <input
                    type="number"
                    name="salary_max"
                    value={form.salary_max}
                    onChange={handleFormChange}
                    placeholder="1400000"
                    min="0"
                    style={modalInputStyle}
                  />
                </div>

                <div>
                  <label style={modalLabelStyle}>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    style={modalInputStyle}
                  >
                    <option>Active</option>
                    <option>Closing Soon</option>
                    <option>Draft</option>
                    <option>Closed</option>
                  </select>
                </div>

                <div
                  style={{
                    gridColumn: "1 / -1",
                  }}
                >
                  <label style={modalLabelStyle}>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Describe the role..."
                    rows="4"
                    style={{
                      ...modalInputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div
                  style={{
                    gridColumn: "1 / -1",
                  }}
                >
                  <label style={modalLabelStyle}>
                    Requirements
                  </label>

                  <textarea
                    name="requirements"
                    value={form.requirements}
                    onChange={handleFormChange}
                    placeholder="React, JavaScript, REST APIs..."
                    rows="4"
                    style={{
                      ...modalInputStyle,
                      resize: "vertical",
                    }}
                  />
                </div>

              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    setCreateModalOpen(false)
                  }
                  style={secondaryModalButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  style={primaryModalButtonStyle}
                >
                  {creating ? "Creating..." : "Create Job"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

/* =================================
   MODAL STYLES
================================= */

const modalLabelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#8EB69B",
  fontSize: "10px",
};

const modalInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: "9px",
  border: "1px solid rgba(142,182,155,.14)",
  outline: "none",
  background: "#051F20",
  color: "#DAF1DE",
  fontSize: "11px",
};

const secondaryModalButtonStyle = {
  border: "1px solid rgba(142,182,155,.14)",
  borderRadius: "9px",
  padding: "10px 16px",
  background: "rgba(142,182,155,.06)",
  color: "#8EB69B",
  cursor: "pointer",
  fontSize: "11px",
};

const primaryModalButtonStyle = {
  border: 0,
  borderRadius: "9px",
  padding: "10px 18px",
  background: "#235347",
  color: "#DAF1DE",
  cursor: "pointer",
  fontSize: "11px",
};

export default Jobs;
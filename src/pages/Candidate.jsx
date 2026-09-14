import {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  Search,
  Plus,
  Users,
  Sparkles,
  UserCheck,
  CalendarDays,
  MapPin,
  BriefcaseBusiness,
  ArrowUpRight,
  Filter,
  ChevronDown,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  XCircle,
  FileText,
  Upload,
  X,
  Check,
  LoaderCircle,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./Candidate.css";

/* =========================================================
   API
========================================================= */

const API_URL =
  "http://localhost:5000/api";

/* =========================================================
   AUTH
========================================================= */

const getAuthToken = () => {
  return (
    localStorage.getItem(
      "hireiq_token"
    ) ||
    localStorage.getItem(
      "hireiqToken"
    ) ||
    localStorage.getItem("token") ||
    sessionStorage.getItem(
      "hireiq_token"
    ) ||
    sessionStorage.getItem("token") ||
    ""
  );
};

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (name = "") => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "NC";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatApplied = (
  dateValue
) => {
  if (!dateValue) {
    return "Not applied";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently";
  }

  const now = new Date();

  const diff = Math.max(
    0,
    now.getTime() -
      date.getTime()
  );

  const minutes = Math.floor(
    diff / (1000 * 60)
  );

  const hours = Math.floor(
    diff / (1000 * 60 * 60)
  );

  const days = Math.floor(
    diff /
      (1000 * 60 * 60 * 24)
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
    const weeks =
      Math.floor(days / 7);

    return `${weeks} week${
      weeks !== 1 ? "s" : ""
    } ago`;
  }

  const months =
    Math.floor(days / 30);

  return `${months} month${
    months !== 1 ? "s" : ""
  } ago`;
};

const getExperienceLabel = (
  years
) => {
  if (
    years === null ||
    years === undefined ||
    years === ""
  ) {
    return "0 yrs";
  }

  const numeric =
    Number(years);

  if (
    Number.isNaN(numeric)
  ) {
    return String(years);
  }

  return `${numeric} yrs`;
};

const normalizeSkills = (
  skills
) => {
  if (Array.isArray(skills)) {
    return skills
      .map((skill) =>
        String(skill).trim()
      )
      .filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) =>
        skill.trim()
      )
      .filter(Boolean);
  }

  return [];
};

const normalizeStatus = (
  status
) => {
  if (!status) {
    return "Available";
  }

  const value =
    String(status).trim();

  if (
    value ===
    "Interview Scheduled"
  ) {
    return "Interview";
  }

  if (value === "Applied") {
    return "Screening";
  }

  if (
    value ===
    "Shortlisted"
  ) {
    return "Shortlisted";
  }

  if (value === "Rejected") {
    return "Rejected";
  }

  if (value === "Selected") {
    return "Shortlisted";
  }

  if (value === "Screening") {
    return "Screening";
  }

  return value;
};

const buildCandidateView = (
  candidate,
  applications = [],
  selectedJob = null
) => {
  const candidateApplications =
    applications.filter(
      (application) =>
        String(
          application.candidate_id
        ) ===
        String(candidate.id)
    );

  let relevantApplications =
    candidateApplications;

  if (selectedJob) {
    relevantApplications =
      candidateApplications.filter(
        (application) =>
          application.job_title ===
          selectedJob
      );
  }

  if (
    !relevantApplications.length
  ) {
    relevantApplications =
      candidateApplications;
  }

  const sortedApplications =
    [...relevantApplications].sort(
      (a, b) => {
        const scoreA =
          a.ai_match_score ===
            null ||
          a.ai_match_score ===
            undefined
            ? -1
            : Number(
                a.ai_match_score
              );

        const scoreB =
          b.ai_match_score ===
            null ||
          b.ai_match_score ===
            undefined
            ? -1
            : Number(
                b.ai_match_score
              );

        if (
          scoreB !== scoreA
        ) {
          return scoreB - scoreA;
        }

        return (
          new Date(
            b.applied_at || 0
          ).getTime() -
          new Date(
            a.applied_at || 0
          ).getTime()
        );
      }
    );

  const primaryApplication =
    sortedApplications[0] ||
    null;

  const match =
    primaryApplication &&
    primaryApplication.ai_match_score !==
      null &&
    primaryApplication.ai_match_score !==
      undefined
      ? Number(
          primaryApplication.ai_match_score
        )
      : 0;

  const role =
    primaryApplication?.job_title ||
    candidate.headline ||
    "Candidate";

  const status =
    normalizeStatus(
      primaryApplication?.status ||
        candidate.status
    );

  return {
    ...candidate,

    initials: getInitials(
      candidate.name
    ),

    role,

    location:
      candidate.location ||
      "Remote",

    experience:
      getExperienceLabel(
        candidate.experience_years
      ),

    applied:
      primaryApplication?.applied_at
        ? formatApplied(
            primaryApplication.applied_at
          )
        : "Not applied",

    match,

    status,

    skills:
      normalizeSkills(
        candidate.skills
      ),

    application:
      primaryApplication,

    applicationCount:
      candidateApplications.length,

    latestApplication:
      sortedApplications[0] ||
      null,
  };
};

/* =========================================================
   COMPONENT
========================================================= */

function Candidates() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const selectedJob =
    location.state?.selectedJob ||
    null;

  const aiReviewMode =
    location.state?.aiReview ||
    false;

  /* =======================================================
     STATE
  ======================================================= */

  const [candidateData, setCandidateData] =
    useState([]);

  const [applicationData, setApplicationData] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [sortOpen, setSortOpen] =
    useState(false);

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState(
      aiReviewMode
        ? "AI Match"
        : "Recent"
    );

  const [showAddCandidate, setShowAddCandidate] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [savingCandidate, setSavingCandidate] =
    useState(false);

  /* =======================================================
     MANUAL FORM
  ======================================================= */

  const [newCandidate, setNewCandidate] =
    useState({
      name: "",
      email: "",
      phone: "",
      role: "",
      location: "",
      experience: "",
      skills: "",
      education: "",
    });

  /* =======================================================
     RESUME STATE
  ======================================================= */

  const [resumeFile, setResumeFile] =
    useState(null);

  const [resumeProcessing, setResumeProcessing] =
    useState(false);

  const [resumeSuccess, setResumeSuccess] =
    useState("");

  const [resumeError, setResumeError] =
    useState("");

  /* =======================================================
     HEADERS
  ======================================================= */

  const getHeaders = () => {
    const token =
      getAuthToken();

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type":
        "application/json",
    };
  };

  /* =======================================================
     FETCH CANDIDATES
  ======================================================= */

  const fetchCandidates =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          getAuthToken();

        if (!token) {
          throw new Error(
            "Please sign in to view candidates."
          );
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          candidatesResponse,
          applicationsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/candidates`,
            {
              method: "GET",
              headers,
            }
          ),

          fetch(
            `${API_URL}/applications`,
            {
              method: "GET",
              headers,
            }
          ),
        ]);

        const candidatesData =
          await candidatesResponse.json();

        const applicationsData =
          await applicationsResponse.json();

        if (
          !candidatesResponse.ok
        ) {
          throw new Error(
            candidatesData.message ||
              "Unable to load candidates."
          );
        }

        if (
          !applicationsResponse.ok
        ) {
          throw new Error(
            applicationsData.message ||
              "Unable to load applications."
          );
        }

        setCandidateData(
          candidatesData.candidates ||
            []
        );

        setApplicationData(
          applicationsData.applications ||
            []
        );
      } catch (err) {
        console.error(
          "Candidates loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load candidates."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    if (aiReviewMode) {
      setSortBy("AI Match");
      setStatusFilter("All");
    }
  }, [aiReviewMode]);

  /* =======================================================
     VIEW DATA
  ======================================================= */

  const viewCandidates =
    useMemo(() => {
      return candidateData.map(
        (candidate) =>
          buildCandidateView(
            candidate,
            applicationData,
            selectedJob
          )
      );
    }, [
      candidateData,
      applicationData,
      selectedJob,
    ]);

  const jobCandidates =
    useMemo(() => {
      if (!selectedJob) {
        return viewCandidates;
      }

      return viewCandidates.filter(
        (candidate) => {
          if (
            candidate.application &&
            candidate.application.job_title ===
              selectedJob
          ) {
            return true;
          }

          return (
            candidate.role ===
              selectedJob ||
            candidate.role
              .toLowerCase()
              .includes(
                selectedJob.toLowerCase()
              )
          );
        }
      );
    }, [
      viewCandidates,
      selectedJob,
    ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredCandidates =
    useMemo(() => {
      let result = [
        ...jobCandidates,
      ];

      if (searchTerm.trim()) {
        const search =
          searchTerm
            .toLowerCase()
            .trim();

        result =
          result.filter(
            (candidate) =>
              candidate.name
                .toLowerCase()
                .includes(search) ||
              candidate.role
                .toLowerCase()
                .includes(search) ||
              candidate.location
                .toLowerCase()
                .includes(search) ||
              candidate.skills.some(
                (skill) =>
                  skill
                    .toLowerCase()
                    .includes(search)
              )
          );
      }

      if (
        statusFilter !==
        "All"
      ) {
        result =
          result.filter(
            (candidate) =>
              candidate.status ===
              statusFilter
          );
      }

      if (
        sortBy ===
        "AI Match"
      ) {
        result.sort(
          (a, b) =>
            b.match - a.match
        );
      }

      if (
        sortBy ===
        "Experience"
      ) {
        result.sort(
          (a, b) => {
            const valueA =
              Number(
                String(
                  a.experience
                ).match(
                  /\d+(\.\d+)?/
                )?.[0] || 0
              );

            const valueB =
              Number(
                String(
                  b.experience
                ).match(
                  /\d+(\.\d+)?/
                )?.[0] || 0
              );

            return (
              valueB - valueA
            );
          }
        );
      }

      if (
        sortBy ===
        "Recent"
      ) {
        result.sort(
          (a, b) => {
            const dateA =
              a.application?.applied_at
                ? new Date(
                    a.application.applied_at
                  ).getTime()
                : 0;

            const dateB =
              b.application?.applied_at
                ? new Date(
                    b.application.applied_at
                  ).getTime()
                : 0;

            return (
              dateB - dateA
            );
          }
        );
      }

      return result;
    }, [
      jobCandidates,
      searchTerm,
      statusFilter,
      sortBy,
    ]);

  /* =======================================================
     SCROLL
  ======================================================= */

  const scrollToCandidates =
    () => {
      document
        .getElementById(
          "candidate-pool"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    };

  const handleReviewMatches =
    () => {
      setSortBy("AI Match");
      setStatusFilter("All");

      setTimeout(
        scrollToCandidates,
        50
      );
    };

  const handleViewAllCandidates =
    () => {
      setSearchTerm("");
      setStatusFilter("All");
      setSortBy("Recent");

      setTimeout(
        scrollToCandidates,
        50
      );
    };

  /* =======================================================
     OPEN PROFILE
  ======================================================= */

  const handleCandidateOpen = (
    candidate
  ) => {
    navigate(
      `/applications/${candidate.id}`,
      {
        state: {
          candidate,
          selectedJob,
        },
      }
    );
  };

  /* =======================================================
     RESET ADD CANDIDATE MODAL
  ======================================================= */

  const resetCandidateModal =
    () => {
      setNewCandidate({
        name: "",
        email: "",
        phone: "",
        role: "",
        location: "",
        experience: "",
        skills: "",
        education: "",
      });

      setResumeFile(null);
      setResumeProcessing(false);
      setResumeSuccess("");
      setResumeError("");
      setSavingCandidate(false);
    };

  const closeCandidateModal =
    () => {
      if (
        savingCandidate ||
        resumeProcessing
      ) {
        return;
      }

      setShowAddCandidate(
        false
      );

      resetCandidateModal();
    };

  /* =======================================================
     RESUME FILE
  ======================================================= */

  const handleResumeChange =
    (event) => {
      const file =
        event.target.files?.[0] ||
        null;

      setResumeError("");
      setResumeSuccess("");

      if (!file) {
        setResumeFile(null);
        return;
      }

      const fileName =
        file.name.toLowerCase();

      const isPdf =
        file.type ===
          "application/pdf" ||
        fileName.endsWith(
          ".pdf"
        );

      const isDocx =
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(
          ".docx"
        );

      if (
        !isPdf &&
        !isDocx
      ) {
        setResumeFile(null);
        setResumeError(
          "Only PDF or DOCX resumes are supported."
        );

        event.target.value = "";
        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setResumeFile(null);
        setResumeError(
          "Resume file must be 5 MB or smaller."
        );

        event.target.value = "";
        return;
      }

      setResumeFile(file);
    };

  /* =======================================================
     UPLOAD RESUME + AI EXTRACTION
  ======================================================= */

  const handleResumeUpload =
    async () => {
      if (!resumeFile) {
        setResumeError(
          "Please select a PDF or DOCX resume first."
        );

        return;
      }

      try {
        setResumeProcessing(true);
        setResumeError("");
        setResumeSuccess("");

        const token =
          getAuthToken();

        if (!token) {
          throw new Error(
            "Please sign in before uploading a resume."
          );
        }

        const formData =
          new FormData();

        formData.append(
          "resume",
          resumeFile
        );

        const response =
          await fetch(
            `${API_URL}/resumes/upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to process resume."
          );
        }

        const extracted =
          data.ai_profile ||
          data.aiProfile ||
          data.profile ||
          data.candidate ||
          {};

        const candidate =
          data.candidate ||
          {};

        const candidateName =
          extracted.name ||
          candidate.name ||
          "Candidate";

        setResumeSuccess(
          `AI extracted ${candidateName}'s profile and created the candidate successfully.`
        );

        /*
          Refresh the live PostgreSQL
          candidate list.
        */

        await fetchCandidates();

        /*
          Close after a short delay so
          recruiter can see success state.
        */

        setTimeout(() => {
          setShowAddCandidate(
            false
          );

          resetCandidateModal();
        }, 900);
      } catch (err) {
        console.error(
          "Resume upload error:",
          err
        );

        setResumeError(
          err.message ||
            "Unable to process resume."
        );
      } finally {
        setResumeProcessing(
          false
        );
      }
    };

  /* =======================================================
     MANUAL ADD
  ======================================================= */

  const handleAddCandidate =
    async () => {
      const name =
        newCandidate.name.trim();

      const role =
        newCandidate.role.trim();

      if (
        !name ||
        !role
      ) {
        alert(
          "Please enter candidate name and role."
        );

        return;
      }

      try {
        setSavingCandidate(true);

        const token =
          getAuthToken();

        if (!token) {
          throw new Error(
            "Please sign in before adding a candidate."
          );
        }

        const experienceValue =
          Number(
            newCandidate.experience.replace(
              /[^\d.]/g,
              ""
            )
          ) || 0;

        const skillsArray =
          newCandidate.skills
            .split(",")
            .map((skill) =>
              skill.trim()
            )
            .filter(Boolean);

        const response =
          await fetch(
            `${API_URL}/candidates`,
            {
              method: "POST",
              headers:
                getHeaders(),
              body: JSON.stringify({
                name,
                email:
                  newCandidate.email.trim() ||
                  null,
                phone:
                  newCandidate.phone.trim() ||
                  null,
                location:
                  newCandidate.location.trim() ||
                  "Remote",
                headline:
                  role,
                experience_years:
                  experienceValue,
                skills:
                  skillsArray.join(
                    ", "
                  ),
                education:
                  newCandidate.education.trim() ||
                  null,
                status:
                  "Available",
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to create candidate."
          );
        }

        setShowAddCandidate(
          false
        );

        resetCandidateModal();

        await fetchCandidates();
      } catch (err) {
        console.error(
          "Add candidate error:",
          err
        );

        alert(
          err.message ||
            "Unable to add candidate."
        );
      } finally {
        setSavingCandidate(
          false
        );
      }
    };

  /* =======================================================
     DATA
  ======================================================= */

  const statuses = [
    "All",
    "Shortlisted",
    "Interview",
    "Screening",
    "Rejected",
  ];

  const sortOptions = [
    "Recent",
    "AI Match",
    "Experience",
  ];

  const displayJob =
    selectedJob ||
    "All Open Positions";

  const highMatches =
    jobCandidates.filter(
      (candidate) =>
        candidate.match >= 85
    ).length;

  const shortlisted =
    jobCandidates.filter(
      (candidate) =>
        candidate.status ===
        "Shortlisted"
    ).length;

  const interviews =
    jobCandidates.filter(
      (candidate) =>
        candidate.status ===
        "Interview"
    ).length;

  const topCandidate =
    [...jobCandidates].sort(
      (a, b) =>
        b.match - a.match
    )[0] || null;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="candidates-page">

        <div
          style={{
            minHeight:
              "420px",
            display:
              "grid",
            placeItems:
              "center",
            color:
              "#759a91",
            fontSize:
              "11px",
          }}
        >
          Loading candidate intelligence...
        </div>

      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="candidates-page">

        <div
          style={{
            padding:
              "16px",
            borderRadius:
              "10px",
            border:
              "1px solid rgba(220,90,90,.22)",
            background:
              "rgba(120,35,35,.12)",
            color:
              "#dba6a6",
            fontSize:
              "11px",
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
    <div className="candidates-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="candidates-header">

        <div>

          <div className="candidates-eyebrow">
            <span></span>
            TALENT INTELLIGENCE
          </div>

          <h1>
            Candidates
          </h1>

          <p>
            {selectedJob
              ? `AI-ranked candidates for ${selectedJob}.`
              : "Discover, evaluate and manage your best talent."}
          </p>

        </div>

        <button
          className="add-candidate-btn"
          onClick={() => {
            resetCandidateModal();

            setShowAddCandidate(
              true
            );
          }}
        >
          <Plus size={16} />
          Add Candidate
        </button>

      </div>

      {/* ===================================================
          SELECTED JOB
      =================================================== */}

      {selectedJob && (
        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: "8px",
            marginBottom:
              "14px",
            padding:
              "9px 12px",
            border:
              "1px solid rgba(103,184,155,.18)",
            borderRadius:
              "8px",
            background:
              "rgba(18,59,51,.55)",
            color:
              "#83d3b5",
            fontSize:
              "8px",
          }}
        >
          <BriefcaseBusiness
            size={13}
          />

          <span
            style={{
              color:
                "#628b80",
            }}
          >
            Reviewing candidates for
          </span>

          <strong
            style={{
              color:
                "#bcebdd",
            }}
          >
            {displayJob}
          </strong>

          <button
            onClick={() =>
              navigate(
                "/jobs"
              )
            }
            style={{
              marginLeft:
                "auto",
              border: 0,
              background:
                "transparent",
              color:
                "#76cdb0",
              fontSize:
                "8px",
              cursor:
                "pointer",
            }}
          >
            Back to Jobs
          </button>

        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="candidate-stats">

        <div className="candidate-stat-card">

          <div className="candidate-stat-icon">
            <Users size={18} />
          </div>

          <div>

            <span>
              Total Candidates
            </span>

            <strong>
              {selectedJob
                ? jobCandidates.length
                : viewCandidates.length}
            </strong>

            <small>
              Live from PostgreSQL
            </small>

          </div>

        </div>

        <div className="candidate-stat-card">

          <div className="candidate-stat-icon">
            <Sparkles size={18} />
          </div>

          <div>

            <span>
              AI Matches
            </span>

            <strong>
              {highMatches}
            </strong>

            <small>
              Above 85% match
            </small>

          </div>

        </div>

        <div className="candidate-stat-card">

          <div className="candidate-stat-icon">
            <UserCheck size={18} />
          </div>

          <div>

            <span>
              Shortlisted
            </span>

            <strong>
              {shortlisted}
            </strong>

            <small>
              Active candidates
            </small>

          </div>

        </div>

        <div className="candidate-stat-card">

          <div className="candidate-stat-icon">
            <CalendarDays
              size={18}
            />
          </div>

          <div>

            <span>
              Interviews
            </span>

            <strong>
              {interviews}
            </strong>

            <small>
              Scheduled candidates
            </small>

          </div>

        </div>

      </div>

      {/* ===================================================
          AI INSIGHT
      =================================================== */}

      <section className="candidate-ai-banner">

        <div className="candidate-ai-icon">
          <BrainCircuit
            size={20}
          />
        </div>

        <div className="candidate-ai-content">

          <div className="candidate-ai-title">

            <strong>
              AI Talent Recommendation
            </strong>

            <span>
              LIVE INSIGHT
            </span>

          </div>

          <p>

            AI found{" "}

            <strong>
              {highMatches} high-match
              candidates
            </strong>

            {" "}for{" "}

            <strong>
              {displayJob}
            </strong>

            . Their match score is
            above 85%.

          </p>

        </div>

        <button
          onClick={
            handleReviewMatches
          }
        >
          Review matches

          <ArrowUpRight
            size={14}
          />

        </button>

      </section>

      {/* ===================================================
          CANDIDATE SECTION
      =================================================== */}

      <section
        className="candidates-section"
        id="candidate-pool"
      >

        <div className="candidates-section-header">

          <div>

            <h2>
              {selectedJob
                ? `${selectedJob} Candidates`
                : "Candidate Pool"}
            </h2>

            <p>
              {selectedJob
                ? "AI-ranked candidates for this position"
                : "All candidates across your hiring pipeline"}
            </p>

          </div>

          <div className="candidate-actions">

            {/* SEARCH */}

            <div className="candidate-search">

              <Search size={15} />

              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />

            </div>

            {/* FILTER */}

            <div
              style={{
                position:
                  "relative",
              }}
            >

              <button
                className="candidate-filter-btn"
                onClick={() => {
                  setFilterOpen(
                    !filterOpen
                  );

                  setSortOpen(
                    false
                  );
                }}
              >

                <Filter
                  size={14}
                />

                Filter

                {statusFilter !==
                  "All" && (
                  <span
                    style={{
                      width:
                        "5px",
                      height:
                        "5px",
                      borderRadius:
                        "50%",
                      background:
                        "#76cdb0",
                    }}
                  />
                )}

              </button>

              {filterOpen && (
                <div
                  style={{
                    position:
                      "absolute",
                    top:
                      "35px",
                    right: 0,
                    zIndex:
                      30,
                    minWidth:
                      "135px",
                    padding:
                      "6px",
                    border:
                      "1px solid rgba(104,168,150,.2)",
                    borderRadius:
                      "8px",
                    background:
                      "#103d35",
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,.3)",
                  }}
                >
                  {statuses.map(
                    (status) => (
                      <button
                        key={
                          status
                        }
                        onClick={() => {
                          setStatusFilter(
                            status
                          );

                          setFilterOpen(
                            false
                          );
                        }}
                        style={{
                          width:
                            "100%",
                          padding:
                            "8px",
                          border:
                            0,
                          borderRadius:
                            "5px",
                          background:
                            statusFilter ===
                            status
                              ? "rgba(118,205,176,.12)"
                              : "transparent",
                          color:
                            "#b8ead8",
                          textAlign:
                            "left",
                          fontSize:
                            "9px",
                          cursor:
                            "pointer",
                        }}
                      >
                        {
                          status
                        }
                      </button>
                    )
                  )}
                </div>
              )}

            </div>

            {/* SORT */}

            <div
              style={{
                position:
                  "relative",
              }}
            >

              <button
                className="candidate-sort-btn"
                onClick={() => {
                  setSortOpen(
                    !sortOpen
                  );

                  setFilterOpen(
                    false
                  );
                }}
              >

                {sortBy}

                <ChevronDown
                  size={14}
                />

              </button>

              {sortOpen && (
                <div
                  style={{
                    position:
                      "absolute",
                    top:
                      "35px",
                    right: 0,
                    zIndex:
                      30,
                    minWidth:
                      "120px",
                    padding:
                      "6px",
                    border:
                      "1px solid rgba(104,168,150,.2)",
                    borderRadius:
                      "8px",
                    background:
                      "#103d35",
                    boxShadow:
                      "0 10px 30px rgba(0,0,0,.3)",
                  }}
                >

                  {sortOptions.map(
                    (option) => (
                      <button
                        key={
                          option
                        }
                        onClick={() => {
                          setSortBy(
                            option
                          );

                          setSortOpen(
                            false
                          );
                        }}
                        style={{
                          width:
                            "100%",
                          padding:
                            "8px",
                          border:
                            0,
                          borderRadius:
                            "5px",
                          background:
                            sortBy ===
                            option
                              ? "rgba(118,205,176,.12)"
                              : "transparent",
                          color:
                            "#b8ead8",
                          textAlign:
                            "left",
                          fontSize:
                            "9px",
                          cursor:
                            "pointer",
                        }}
                      >
                        {
                          option
                        }
                      </button>
                    )
                  )}

                </div>
              )}

            </div>

          </div>

        </div>

        <div className="candidate-table-header">

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

        <div className="candidate-list">

          {filteredCandidates.length >
          0 ? (
            filteredCandidates.map(
              (candidate) => (
                <div
                  className="candidate-row"
                  key={
                    candidate.id
                  }
                >

                  <div className="candidate-main">

                    <div className="candidate-avatar">
                      {candidate.initials}
                    </div>

                    <div className="candidate-info">

                      <strong>
                        {
                          candidate.name
                        }
                      </strong>

                      <div>

                        <MapPin
                          size={10}
                        />

                        {
                          candidate.location
                        }

                      </div>

                    </div>

                  </div>

                  <div className="candidate-role">

                    <strong>
                      {
                        candidate.role
                      }
                    </strong>

                    <span>

                      <BriefcaseBusiness
                        size={10}
                      />

                      Full-time

                    </span>

                  </div>

                  <div className="candidate-experience">

                    <Clock3
                      size={12}
                    />

                    <span>
                      {
                        candidate.experience
                      }
                    </span>

                  </div>

                  <div className="candidate-match">

                    <div className="candidate-match-top">

                      <Sparkles
                        size={12}
                      />

                      <strong>
                        {
                          candidate.match
                        }%
                      </strong>

                    </div>

                    <div className="candidate-match-track">

                      <div
                        className="candidate-match-fill"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              candidate.match
                            )
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  <div>

                    <span
                      className={`candidate-status ${String(
                        candidate.status
                      )
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          "-"
                        )}`}
                    >

                      {candidate.status ===
                        "Shortlisted" && (
                        <CheckCircle2
                          size={10}
                        />
                      )}

                      {candidate.status ===
                        "Interview" && (
                        <CalendarDays
                          size={10}
                        />
                      )}

                      {candidate.status ===
                        "Screening" && (
                        <Clock3
                          size={10}
                        />
                      )}

                      {candidate.status ===
                        "Rejected" && (
                        <XCircle
                          size={10}
                        />
                      )}

                      {
                        candidate.status
                      }

                    </span>

                  </div>

                  <div className="candidate-applied">

                    {
                      candidate.applied
                    }

                  </div>

                  <button
                    className="candidate-more"
                    onClick={() =>
                      handleCandidateOpen(
                        candidate
                      )
                    }
                    title="View candidate profile"
                  >
                    <ArrowUpRight
                      size={15}
                    />
                  </button>

                </div>
              )
            )
          ) : (
            <div
              style={{
                padding:
                  "35px",
                textAlign:
                  "center",
                color:
                  "#759a91",
                fontSize:
                  "11px",
              }}
            >

              <Search
                size={20}
                style={{
                  marginBottom:
                    "8px",
                  opacity:
                    0.6,
                }}
              />

              <div>
                No candidates found.
              </div>

              <span
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                  fontSize:
                    "9px",
                }}
              >
                Try changing your search,
                filter or selected job.
              </span>

            </div>
          )}

        </div>

        <div className="candidate-footer">

          <span>

            Showing{" "}

            <strong>
              {
                filteredCandidates.length
              }
            </strong>

            {" "}of{" "}

            <strong>
              {
                jobCandidates.length
              }
            </strong>

            {" "}candidates

          </span>

          <button
            onClick={
              handleViewAllCandidates
            }
          >
            View all candidates

            <ArrowUpRight
              size={13}
            />

          </button>

        </div>

      </section>

      {/* ===================================================
          BOTTOM INSIGHTS
      =================================================== */}

      <div className="candidate-insights">

        <div
          className="candidate-insight-card"
          onClick={() => {
            setSortBy("AI Match");
            setStatusFilter("All");

            setTimeout(
              scrollToCandidates,
              50
            );
          }}
          style={{
            cursor:
              "pointer",
          }}
        >

          <div className="insight-card-icon">
            <CheckCircle2
              size={16}
            />
          </div>

          <div>

            <strong>
              Top Candidate
            </strong>

            <span>
              {topCandidate
                ? `${topCandidate.name} · ${topCandidate.match}% AI Match`
                : "No matching candidate"}
            </span>

          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

        <div
          className="candidate-insight-card"
          onClick={
            handleReviewMatches
          }
          style={{
            cursor:
              "pointer",
          }}
        >

          <div className="insight-card-icon">
            <Sparkles
              size={16}
            />
          </div>

          <div>

            <strong>
              AI Screening
            </strong>

            <span>
              {
                highMatches
              }{" "}
              high-match candidates
              available
            </span>

          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

        <div
          className="candidate-insight-card"
          onClick={() => {
            setSearchTerm(
              "Frontend"
            );

            setStatusFilter(
              "All"
            );

            scrollToCandidates();
          }}
          style={{
            cursor:
              "pointer",
          }}
        >

          <div className="insight-card-icon">
            <Users size={16} />
          </div>

          <div>

            <strong>
              Talent Pool
            </strong>

            <span>
              Frontend specialists
            </span>

          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

      </div>

      {/* ===================================================
          ADD CANDIDATE MODAL
      =================================================== */}

      {showAddCandidate && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex:
              100,
            background:
              "rgba(3,20,17,.72)",
            backdropFilter:
              "blur(5px)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding:
              "20px",
          }}
          onClick={
            closeCandidateModal
          }
        >

          <div
            style={{
              width:
                "min(520px, 100%)",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              background:
                "#0d302a",
              border:
                "1px solid rgba(118,205,176,.18)",
              borderRadius:
                "14px",
              padding:
                "22px",
              boxShadow:
                "0 25px 80px rgba(0,0,0,.45)",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =============================================
                MODAL HEADER
            ============================================= */}

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap:
                  "10px",
                marginBottom:
                  "18px",
              }}
            >

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                }}
              >

                <div
                  style={{
                    width:
                      "34px",
                    height:
                      "34px",
                    borderRadius:
                      "9px",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    background:
                      "rgba(118,205,176,.1)",
                    color:
                      "#83d3b5",
                  }}
                >
                  <Users
                    size={17}
                  />
                </div>

                <div>

                  <h3
                    style={{
                      margin:
                        0,
                      color:
                        "#d7f4e9",
                      fontSize:
                        "14px",
                    }}
                  >
                    Add Candidate
                  </h3>

                  <p
                    style={{
                      margin:
                        "3px 0 0",
                      color:
                        "#70988f",
                      fontSize:
                        "9px",
                    }}
                  >
                    Add manually or let AI
                    create a candidate from a
                    resume.
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeCandidateModal
                }
                disabled={
                  savingCandidate ||
                  resumeProcessing
                }
                style={{
                  width:
                    "28px",
                  height:
                    "28px",
                  border: 0,
                  borderRadius:
                    "7px",
                  display:
                    "grid",
                  placeItems:
                    "center",
                  background:
                    "rgba(255,255,255,.04)",
                  color:
                    "#769990",
                  cursor:
                    "pointer",
                }}
              >
                <X size={14} />
              </button>

            </div>

            {/* =============================================
                RESUME UPLOAD
            ============================================= */}

            <div
              style={{
                marginBottom:
                  "17px",
                padding:
                  "13px",
                border:
                  "1px solid rgba(118,205,176,.14)",
                borderRadius:
                  "10px",
                background:
                  "rgba(118,205,176,.035)",
              }}
            >

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                  marginBottom:
                    "9px",
                }}
              >

                <FileText
                  size={14}
                  color="#83d3b5"
                />

                <strong
                  style={{
                    color:
                      "#bcebdd",
                    fontSize:
                      "10px",
                  }}
                >
                  AI Resume Upload
                </strong>

                <span
                  style={{
                    marginLeft:
                      "auto",
                    color:
                      "#648b80",
                    fontSize:
                      "8px",
                  }}
                >
                  PDF / DOCX · Max 5 MB
                </span>

              </div>

              <label
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                  padding:
                    "12px",
                  border:
                    "1px dashed rgba(118,205,176,.22)",
                  borderRadius:
                    "8px",
                  background:
                    "rgba(255,255,255,.018)",
                  cursor:
                    resumeProcessing
                      ? "not-allowed"
                      : "pointer",
                }}
              >

                <div
                  style={{
                    width:
                      "32px",
                    height:
                      "32px",
                    borderRadius:
                      "8px",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    background:
                      "rgba(118,205,176,.08)",
                    color:
                      "#76cdb0",
                  }}
                >
                  <Upload size={15} />
                </div>

                <div
                  style={{
                    minWidth:
                      0,
                    flex:
                      1,
                  }}
                >

                  <strong
                    style={{
                      display:
                        "block",
                      color:
                        "#bcebdd",
                      fontSize:
                        "9px",
                    }}
                  >
                    {resumeFile
                      ? resumeFile.name
                      : "Choose resume"}
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        "3px",
                      color:
                        "#668d83",
                      fontSize:
                        "8px",
                    }}
                  >
                    AI will extract candidate
                    details automatically.
                  </span>

                </div>

                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={
                    handleResumeChange
                  }
                  disabled={
                    resumeProcessing
                  }
                  style={{
                    display:
                      "none",
                  }}
                />

              </label>

              {resumeFile && (
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "8px",
                    marginTop:
                      "8px",
                  }}
                >

                  <Check
                    size={12}
                    color="#76cdb0"
                  />

                  <span
                    style={{
                      color:
                        "#81b6a5",
                      fontSize:
                        "8px",
                    }}
                  >
                    Ready for AI processing
                    ·{" "}
                    {(
                      resumeFile.size /
                      (1024 *
                        1024)
                    ).toFixed(
                      2
                    )}{" "}
                    MB
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setResumeFile(
                        null
                      )
                    }
                    disabled={
                      resumeProcessing
                    }
                    style={{
                      marginLeft:
                        "auto",
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#759990",
                      cursor:
                        "pointer",
                      display:
                        "grid",
                      placeItems:
                        "center",
                    }}
                  >
                    <X size={12} />
                  </button>

                </div>
              )}

              {resumeError && (
                <div
                  style={{
                    marginTop:
                      "9px",
                    padding:
                      "8px 9px",
                    borderRadius:
                      "7px",
                    background:
                      "rgba(150,65,65,.10)",
                    border:
                      "1px solid rgba(220,90,90,.18)",
                    color:
                      "#d9a2a2",
                    fontSize:
                      "8px",
                    lineHeight:
                      1.45,
                  }}
                >
                  {resumeError}
                </div>
              )}

              {resumeSuccess && (
                <div
                  style={{
                    marginTop:
                      "9px",
                    padding:
                      "8px 9px",
                    borderRadius:
                      "7px",
                    background:
                      "rgba(76,160,126,.10)",
                    border:
                      "1px solid rgba(118,205,176,.18)",
                    color:
                      "#9ed9c2",
                    fontSize:
                      "8px",
                    lineHeight:
                      1.45,
                  }}
                >
                  {resumeSuccess}
                </div>
              )}

              <button
                type="button"
                onClick={
                  handleResumeUpload
                }
                disabled={
                  !resumeFile ||
                  resumeProcessing
                }
                style={{
                  width:
                    "100%",
                  marginTop:
                    "10px",
                  padding:
                    "10px",
                  border:
                    "none",
                  borderRadius:
                    "7px",
                  background:
                    resumeFile &&
                    !resumeProcessing
                      ? "#76cdb0"
                      : "rgba(118,205,176,.16)",
                  color:
                    resumeFile &&
                    !resumeProcessing
                      ? "#08251f"
                      : "#6e958b",
                  fontSize:
                    "9px",
                  fontWeight:
                    700,
                  cursor:
                    resumeFile &&
                    !resumeProcessing
                      ? "pointer"
                      : "not-allowed",
                }}
              >

                {resumeProcessing ? (
                  <span
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap:
                        "6px",
                    }}
                  >
                    <LoaderCircle
                      size={12}
                      style={{
                        animation:
                          "hireiq-spin 1s linear infinite",
                      }}
                    />

                    AI is extracting resume
                    data...
                  </span>
                ) : (
                  <span
                    style={{
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap:
                        "6px",
                    }}
                  >
                    <Sparkles
                      size={12}
                    />

                    Upload & Extract with AI
                  </span>
                )}

              </button>

            </div>

            {/* =============================================
                DIVIDER
            ============================================= */}

            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap:
                  "9px",
                margin:
                  "4px 0 14px",
              }}
            >

              <span
                style={{
                  height:
                    "1px",
                  flex:
                    1,
                  background:
                    "rgba(118,205,176,.08)",
                }}
              />

              <span
                style={{
                  color:
                    "#567c72",
                  fontSize:
                    "8px",
                }}
              >
                OR ADD MANUALLY
              </span>

              <span
                style={{
                  height:
                    "1px",
                  flex:
                    1,
                  background:
                    "rgba(118,205,176,.08)",
                }}
              />

            </div>

            {/* =============================================
                MANUAL FORM
            ============================================= */}

            <input
              value={
                newCandidate.name
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  name: event.target
                    .value,
                })
              }
              placeholder="Candidate name"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "9px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            <input
              value={
                newCandidate.email
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  email: event.target
                    .value,
                })
              }
              placeholder="Email"
              type="email"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "9px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            <input
              value={
                newCandidate.phone
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  phone: event.target
                    .value,
                })
              }
              placeholder="Phone"
              type="tel"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "9px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            <input
              value={
                newCandidate.role
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  role: event.target
                    .value,
                })
              }
              placeholder="Applied role / headline"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "9px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            <input
              value={
                newCandidate.location
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  location:
                    event.target.value,
                })
              }
              placeholder="Location"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "9px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            <input
              value={
                newCandidate.experience
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  experience:
                    event.target
                      .value,
                })
              }
              placeholder="Experience e.g. 4 yrs"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "9px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            <input
              value={
                newCandidate.skills
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  skills:
                    event.target
                      .value,
                })
              }
              placeholder="Skills — React, TypeScript, PostgreSQL"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "9px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            <input
              value={
                newCandidate.education
              }
              onChange={(
                event
              ) =>
                setNewCandidate({
                  ...newCandidate,
                  education:
                    event.target
                      .value,
                })
              }
              placeholder="Education"
              disabled={
                resumeProcessing
              }
              style={{
                width:
                  "100%",
                boxSizing:
                  "border-box",
                marginBottom:
                  "18px",
                padding:
                  "10px 11px",
                border:
                  "1px solid rgba(118,205,176,.16)",
                borderRadius:
                  "7px",
                background:
                  "rgba(255,255,255,.025)",
                color:
                  "#d7f4e9",
                outline:
                  "none",
                fontSize:
                  "10px",
              }}
            />

            {/* =============================================
                FOOTER
            ============================================= */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "8px",
              }}
            >

              <button
                type="button"
                onClick={
                  closeCandidateModal
                }
                disabled={
                  savingCandidate ||
                  resumeProcessing
                }
                style={{
                  padding:
                    "9px 14px",
                  border:
                    "1px solid rgba(118,205,176,.15)",
                  borderRadius:
                    "7px",
                  background:
                    "transparent",
                  color:
                    "#8eafa6",
                  fontSize:
                    "9px",
                  cursor:
                    savingCandidate ||
                    resumeProcessing
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    savingCandidate ||
                    resumeProcessing
                      ? 0.6
                      : 1,
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleAddCandidate
                }
                disabled={
                  savingCandidate ||
                  resumeProcessing
                }
                style={{
                  padding:
                    "9px 15px",
                  border:
                    "none",
                  borderRadius:
                    "7px",
                  background:
                    "#76cdb0",
                  color:
                    "#08251f",
                  fontSize:
                    "9px",
                  fontWeight:
                    700,
                  cursor:
                    savingCandidate ||
                    resumeProcessing
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    savingCandidate ||
                    resumeProcessing
                      ? 0.7
                      : 1,
                }}
              >
                {savingCandidate
                  ? "Saving..."
                  : "Add Candidate"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          SPINNER ANIMATION
      =================================================== */}

      <style>
        {`
          @keyframes hireiq-spin {
            from {
              transform: rotate(0deg);
            }

            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

    </div>
  );
}

export default Candidates;
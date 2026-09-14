import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  Award,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import "./CandidateProfile.css";

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
    localStorage.getItem(
      "token"
    ) ||
    sessionStorage.getItem(
      "hireiq_token"
    ) ||
    sessionStorage.getItem(
      "token"
    ) ||
    ""
  );
};

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (
  name = ""
) => {
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

const getExperience = (
  years
) => {
  if (
    years === null ||
    years === undefined ||
    years === ""
  ) {
    return "0 years";
  }

  const value =
    Number(years);

  if (Number.isNaN(value)) {
    return String(years);
  }

  return `${value} years`;
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

  const diff = Math.max(
    0,
    Date.now() -
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
      (1000 *
        60 *
        60 *
        24)
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
      Math.floor(
        days / 7
      );

    return `${weeks} week${
      weeks !== 1 ? "s" : ""
    } ago`;
  }

  const months =
    Math.floor(
      days / 30
    );

  return `${months} month${
    months !== 1 ? "s" : ""
  } ago`;
};

const normalizeStatus = (
  status
) => {
  if (!status) {
    return "Available";
  }

  if (
    status ===
    "Interview Scheduled"
  ) {
    return "Interview";
  }

  if (status === "Applied") {
    return "Screening";
  }

  if (status === "Selected") {
    return "Shortlisted";
  }

  return status;
};

/* =========================================================
   BUILD PROFILE
========================================================= */

const buildProfile = (
  candidate,
  applications = [],
  fallbackCandidate = null
) => {
  const candidateApplications =
    applications.filter(
      (application) =>
        String(
          application.candidate_id
        ) ===
        String(
          candidate.id
        )
    );

  const sortedApplications =
    [...candidateApplications].sort(
      (a, b) => {
        const scoreA =
          a.ai_match_score == null
            ? -1
            : Number(
                a.ai_match_score
              );

        const scoreB =
          b.ai_match_score == null
            ? -1
            : Number(
                b.ai_match_score
              );

        if (
          scoreA !== scoreB
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

  const application =
    sortedApplications[0] ||
    null;

  const skills =
    normalizeSkills(
      candidate.skills ||
        fallbackCandidate?.skills
    );

  const match =
    application?.ai_match_score !=
    null
      ? Number(
          application.ai_match_score
        )
      : Number(
          fallbackCandidate?.match ||
            0
        );

  const role =
    application?.job_title ||
    candidate.headline ||
    fallbackCandidate?.role ||
    "Candidate";

  const status =
    normalizeStatus(
      application?.status ||
        candidate.status ||
        fallbackCandidate?.status
    );

  const name =
    candidate.name ||
    fallbackCandidate?.name ||
    "Candidate";

  const location =
    candidate.location ||
    fallbackCandidate?.location ||
    "Remote";

  const experience =
    getExperience(
      candidate.experience_years ??
        fallbackCandidate?.experience
    );

  const education =
    candidate.education ||
    fallbackCandidate?.education ||
    "Education details not available";

  const email =
    candidate.email ||
    fallbackCandidate?.email ||
    "Email not available";

  const phone =
    candidate.phone ||
    fallbackCandidate?.phone ||
    "Phone not available";

  return {
    id: candidate.id,

    name,

    initials:
      fallbackCandidate?.initials ||
      getInitials(name),

    role,

    location,

    email,

    phone,

    experience,

    education,

    status,

    match,

    applied:
      application?.applied_at
        ? formatApplied(
            application.applied_at
          )
        : fallbackCandidate?.applied ||
          "Not applied",

    skills,

    application,

    summary:
      candidate.headline ||
      fallbackCandidate?.summary ||
      `${name} is a candidate in the HireIQ talent pipeline. The profile was extracted from the candidate record and application data.`,

    strengths:
      skills.length > 0
        ? skills
            .slice(0, 3)
            .map(
              (skill) =>
                `Experience with ${skill}`
            )
        : [
            "Candidate profile available",
            "Application data available",
            "AI screening data available",
          ],
  };
};

/* =========================================================
   CANDIDATE PROFILE
========================================================= */

function CandidateProfile() {
  const navigate =
    useNavigate();

  const {
    candidateId,
  } = useParams();

  const location =
    useLocation();

  const fallbackCandidate =
    location.state?.candidate ||
    null;

  const [
    candidate,
    setCandidate,
  ] = useState(
    fallbackCandidate
      ? {
          ...fallbackCandidate,
          skills:
            normalizeSkills(
              fallbackCandidate.skills
            ),
        }
      : null
  );

  const [
    loading,
    setLoading,
  ] = useState(
    !fallbackCandidate
  );

  const [
    error,
    setError,
  ] = useState("");

  const [
    currentStatus,
    setCurrentStatus,
  ] = useState(
    fallbackCandidate?.status ||
      "Available"
  );

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  /* =======================================================
     FETCH CANDIDATE
  ======================================================= */

  const fetchCandidate =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const token =
            getAuthToken();

          if (!token) {
            throw new Error(
              "Please sign in to view candidate profile."
            );
          }

          const headers = {
            Authorization: `Bearer ${token}`,
          };

          /*
            We intentionally use the existing candidates
            and applications APIs because they already return
            the real PostgreSQL candidate/application records.
          */

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
                "Unable to load candidate."
            );
          }

          if (
            !applicationsResponse.ok
          ) {
            throw new Error(
              applicationsData.message ||
                "Unable to load application."
            );
          }

          const candidates =
            candidatesData.candidates ||
            [];

          const applications =
            applicationsData.applications ||
            [];

          const realCandidate =
            candidates.find(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  candidateId
                )
            );

          if (!realCandidate) {
            throw new Error(
              "Candidate not found."
            );
          }

          const profile =
            buildProfile(
              realCandidate,
              applications,
              fallbackCandidate
            );

          setCandidate(
            profile
          );

          setCurrentStatus(
            profile.status
          );
        } catch (err) {
          console.error(
            "Candidate profile error:",
            err
          );

          setError(
            err.message ||
              "Unable to load candidate profile."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        candidateId,
        fallbackCandidate,
      ]
    );

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  /* =======================================================
     STATUS UI
  ======================================================= */

  const handleStatusChange =
    (status) => {
      setCurrentStatus(
        status
      );

      setActionMessage(
        status ===
          "Shortlisted"
          ? "Candidate has been moved to the shortlist."
          : status ===
              "Interview"
          ? "Candidate moved to interview stage."
          : "Candidate has been rejected."
      );

      setTimeout(() => {
        setActionMessage("");
      }, 3000);
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="candidate-profile-page">

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
          Loading candidate profile...
        </div>

      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !candidate
  ) {
    return (
      <div className="candidate-profile-page">

        <button
          className="candidate-back-btn"
          onClick={() =>
            navigate(
              "/applications"
            )
          }
        >
          <ArrowLeft
            size={15}
          />

          Back to Applications

        </button>

        <div className="candidate-not-found">

          <h2>
            Candidate not found
          </h2>

          <p>
            {error ||
              "The candidate profile you are looking for does not exist."}
          </p>

        </div>

      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="candidate-profile-page">

      {/* ===================================================
          BACK
      =================================================== */}

      <button
        className="candidate-back-btn"
        onClick={() =>
          navigate(
            "/applications"
          )
        }
      >
        <ArrowLeft
          size={15}
        />

        Back to Applications

      </button>

      {/* ACTION MESSAGE */}

      {actionMessage && (
        <div className="candidate-action-message">
          <CheckCircle2
            size={15}
          />

          <span>
            {actionMessage}
          </span>

        </div>
      )}

      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="candidate-profile-header">

        <div className="candidate-profile-main">

          <div className="candidate-profile-avatar">
            {candidate.initials}
          </div>

          <div className="candidate-profile-identity">

            <div className="candidate-profile-eyebrow">
              <span></span>
              CANDIDATE PROFILE
            </div>

            <h1>
              {candidate.name}
            </h1>

            <h3>
              {candidate.role}
            </h3>

            <div className="candidate-profile-meta">

              <span>
                <MapPin
                  size={13}
                />

                {candidate.location}
              </span>

              <span>
                <Briefcase
                  size={13}
                />

                {candidate.experience}
              </span>

              <span>
                Applied{" "}
                {candidate.applied}
              </span>

            </div>

          </div>

        </div>

        <div className="candidate-profile-actions">

          <span
            className={`candidate-status ${String(
              currentStatus
            )
              .toLowerCase()
              .replace(
                /\s+/g,
                "-"
              )}`}
          >
            <CheckCircle2
              size={13}
            />

            {currentStatus}
          </span>

          <button
            className="candidate-action-btn candidate-shortlist-btn"
            onClick={() =>
              handleStatusChange(
                "Shortlisted"
              )
            }
          >
            <CheckCircle2
              size={14}
            />

            Shortlist
          </button>

          <button
            className="candidate-interview-btn"
            onClick={() => {
              handleStatusChange(
                "Interview"
              );

              navigate(
                `/interviews?candidate=${encodeURIComponent(
                  candidate.name
                )}`
              );
            }}
          >
            <CalendarDays
              size={14}
            />

            Schedule Interview

          </button>

          <button
            className="candidate-action-btn candidate-reject-btn"
            onClick={() =>
              handleStatusChange(
                "Rejected"
              )
            }
          >
            Reject
          </button>

        </div>

      </section>

      {/* ===================================================
          AI SCORE
      =================================================== */}

      <section className="candidate-ai-card">

        <div className="candidate-ai-left">

          <div className="candidate-ai-icon">
            <Sparkles
              size={19}
            />
          </div>

          <div>

            <div className="candidate-ai-title">

              AI Candidate Evaluation

              <span>
                AI POWERED
              </span>

            </div>

            <p>
              Candidate evaluated against
              the requirements of the
              applied position.
            </p>

          </div>

        </div>

        <div className="candidate-match-score">

          <strong>
            {Number(
              candidate.match ||
                0
            ).toFixed(0)}
            %
          </strong>

          <span>
            AI Match
          </span>

        </div>

      </section>

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="candidate-profile-grid">

        {/* =================================================
            RECRUITER DECISION
        ================================================= */}

        <section className="candidate-decision-card">

          <div className="candidate-decision-header">

            <div>

              <h2>
                Recruiter Decision
              </h2>

              <p>
                Take action based on
                candidate evaluation.
              </p>

            </div>

            <span>
              {currentStatus}
            </span>

          </div>

          <div className="candidate-decision-actions">

            <button
              className="candidate-decision-shortlist"
              onClick={() =>
                handleStatusChange(
                  "Shortlisted"
                )
              }
            >
              <CheckCircle2
                size={15}
              />

              Shortlist Candidate
            </button>

            <button
              className="candidate-decision-interview"
              onClick={() => {
                handleStatusChange(
                  "Interview"
                );

                navigate(
                  `/interviews?candidate=${encodeURIComponent(
                    candidate.name
                  )}`
                );
              }}
            >
              <CalendarDays
                size={15}
              />

              Move to Interview

            </button>

            <button
              className="candidate-decision-reject"
              onClick={() =>
                handleStatusChange(
                  "Rejected"
                )
              }
            >
              Reject Candidate
            </button>

          </div>

        </section>

        {/* =================================================
            LEFT
        ================================================= */}

        <div className="candidate-profile-left">

          {/* PROFESSIONAL SUMMARY */}

          <section className="candidate-card">

            <div className="candidate-card-header">

              <h2>
                Professional Summary
              </h2>

            </div>

            <p className="candidate-summary">
              {candidate.summary}
            </p>

          </section>

          {/* EXPERIENCE */}

          <section className="candidate-card">

            <div className="candidate-card-header">

              <h2>

                <Briefcase
                  size={15}
                />

                Experience

              </h2>

            </div>

            <div className="candidate-experience-item">

              <div className="candidate-timeline-dot"></div>

              <div>

                <strong>
                  {candidate.role}
                </strong>

                <span className="candidate-company">
                  Professional Experience
                </span>

                <span className="candidate-duration">
                  {candidate.experience}
                </span>

                <p>
                  Candidate experience
                  information is available
                  from the live profile data.
                </p>

              </div>

            </div>

          </section>

          {/* SKILLS */}

          <section className="candidate-card">

            <div className="candidate-card-header">

              <h2>

                <Award
                  size={15}
                />

                Skills & Expertise

              </h2>

            </div>

            <div className="candidate-skills">

              {candidate.skills.length >
              0 ? (
                candidate.skills.map(
                  (skill) => (
                    <span
                      key={
                        skill
                      }
                    >
                      {skill}
                    </span>
                  )
                )
              ) : (
                <span>
                  Skills not available
                </span>
              )}

            </div>

          </section>

        </div>

        {/* =================================================
            RIGHT
        ================================================= */}

        <div className="candidate-profile-right">

          {/* CONTACT */}

          <section className="candidate-card">

            <div className="candidate-card-header">

              <h2>
                Contact Information
              </h2>

            </div>

            <div className="candidate-contact-list">

              <div>

                <Mail
                  size={14}
                />

                <span>
                  {candidate.email}
                </span>

              </div>

              <div>

                <Phone
                  size={14}
                />

                <span>
                  {candidate.phone}
                </span>

              </div>

              <div>

                <MapPin
                  size={14}
                />

                <span>
                  {candidate.location}
                </span>

              </div>

            </div>

          </section>

          {/* EDUCATION */}

          <section className="candidate-card">

            <div className="candidate-card-header">

              <h2>

                <GraduationCap
                  size={15}
                />

                Education

              </h2>

            </div>

            <div className="candidate-education">

              <strong>
                {candidate.education}
              </strong>

              <span>
                Candidate education profile
              </span>

            </div>

          </section>

          {/* AI STRENGTHS */}

          <section className="candidate-card candidate-ai-strength-card">

            <div className="candidate-card-header">

              <h2>

                <Sparkles
                  size={15}
                />

                AI Strengths

              </h2>

            </div>

            <div className="candidate-strengths">

              {(candidate.strengths || []).map(
                (strength) => (
                  <div
                    key={
                      strength
                    }
                  >

                    <CheckCircle2
                      size={13}
                    />

                    <span>
                      {strength}
                    </span>

                  </div>
                )
              )}

            </div>

          </section>

          {/* APPLICATION DETAILS */}

          <section className="candidate-card">

            <div className="candidate-card-header">

              <h2>
                Application Details
              </h2>

            </div>

            <div className="candidate-application-details">

              <div>

                <span>
                  Status
                </span>

                <strong>
                  {currentStatus}
                </strong>

              </div>

              <div>

                <span>
                  AI Match
                </span>

                <strong>
                  {Number(
                    candidate.match ||
                      0
                  ).toFixed(0)}
                  %
                </strong>

              </div>

              <div>

                <span>
                  Applied
                </span>

                <strong>
                  {candidate.applied}
                </strong>

              </div>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}

export default CandidateProfile;
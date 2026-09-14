import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserCheck,
  XCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import "./CandidateDetails.css";

const candidate = {
  name: "Sarah Wilson",
  initials: "SW",
  location: "New York, USA",
  email: "sarah.wilson@email.com",
  phone: "+1 212 555 0184",
  position: "Senior Product Designer",
  type: "Full-time",
  experience: "6 years",
  match: "94%",
  status: "Shortlisted",
  applied: "2 days ago",
  summary:
    "Senior product designer with strong experience in building scalable digital products, design systems and user-centered experiences.",
  skills: [
    "Product Design",
    "UX Research",
    "Figma",
    "Design Systems",
    "Prototyping",
    "User Research",
  ],
};

function CandidateDetails() {
  const navigate = useNavigate();

  const [candidateStatus, setCandidateStatus] = useState(
    candidate.status
  );

  return (
    <div className="candidate-details-page">

      {/* ================= TOP BAR ================= */}

      <div className="candidate-details-top">

        <button
          className="candidate-back-btn"
          onClick={() => navigate("/applications")}
        >
          <ArrowLeft size={15} />
          Back to applications
        </button>

        <div className="candidate-top-actions">

          <button
            className="candidate-reject-btn"
            onClick={() => setCandidateStatus("Rejected")}
          >
            <XCircle size={14} />
            Reject
          </button>

           <button
  className="candidate-interview-btn"
  onClick={() => navigate(`/interviews?candidate=${candidate.name}`)}
>
  <CalendarDays size={14} />
  Schedule Interview
</button>

          <button
            className="candidate-shortlist-btn"
            onClick={() => setCandidateStatus("Shortlisted")}
          >
            <CheckCircle2 size={14} />
            {candidateStatus === "Shortlisted"
              ? "Shortlisted"
              : "Shortlist"}
          </button>

        </div>

      </div>

      {/* ================= PROFILE HEADER ================= */}

      <section className="candidate-profile-card">

        <div className="candidate-profile-main">

          <div className="candidate-large-avatar">
            {candidate.initials}
          </div>

          <div className="candidate-profile-info">

            <div className="candidate-name-row">

              <h1>{candidate.name}</h1>

              <span className="candidate-status-badge">
                {candidateStatus === "Shortlisted" ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <XCircle size={11} />
                )}

                {candidateStatus}
              </span>

            </div>

            <p className="candidate-position">
              {candidate.position}
            </p>

            <div className="candidate-meta">

              <span>
                <MapPin size={12} />
                {candidate.location}
              </span>

              <span>
                <Clock3 size={12} />
                {candidate.experience}
              </span>

              <span>
                <FileText size={12} />
                {candidate.type}
              </span>

            </div>

          </div>

        </div>

        {/* ================= MATCH SCORE ================= */}

        <div className="candidate-match-box">

          <div className="candidate-match-icon">
            <Sparkles size={16} />
          </div>

          <div>
            <span>AI MATCH</span>
            <strong>{candidate.match}</strong>
            <small>Excellent match</small>
          </div>

        </div>

      </section>

      {/* ================= MAIN CONTENT ================= */}

      <div className="candidate-details-grid">

        {/* ================= LEFT COLUMN ================= */}

        <div className="candidate-details-left">

          {/* ABOUT */}

          <section className="candidate-details-card">

            <div className="candidate-card-title">
              <div>
                <h2>Candidate Overview</h2>
                <p>Professional summary and background</p>
              </div>
            </div>

            <p className="candidate-summary">
              {candidate.summary}
            </p>

          </section>

          {/* EXPERIENCE */}

          <section className="candidate-details-card">

            <div className="candidate-card-title">
              <div>
                <h2>Experience</h2>
                <p>Professional career history</p>
              </div>
            </div>

            <div className="candidate-experience-item">

              <div className="experience-icon">
                <UserCheck size={15} />
              </div>

              <div className="experience-content">

                <strong>Senior Product Designer</strong>

                <span className="experience-company">
                  Digital Product Studio
                </span>

                <span className="experience-duration">
                  2021 — Present · 3+ years
                </span>

                <p>
                  Led product design initiatives across multiple
                  digital products, collaborating with engineering
                  and product teams to deliver user-focused solutions.
                </p>

              </div>

            </div>

            <div className="candidate-experience-item">

              <div className="experience-icon">
                <UserCheck size={15} />
              </div>

              <div className="experience-content">

                <strong>Product Designer</strong>

                <span className="experience-company">
                  Creative Labs
                </span>

                <span className="experience-duration">
                  2018 — 2021 · 3 years
                </span>

                <p>
                  Designed web and mobile experiences and contributed
                  to the development of a company-wide design system.
                </p>

              </div>

            </div>

          </section>

          {/* SKILLS */}

          <section className="candidate-details-card">

            <div className="candidate-card-title">
              <div>
                <h2>Skills & Expertise</h2>
                <p>Key capabilities identified from the profile</p>
              </div>
            </div>

            <div className="candidate-skills">

              {candidate.skills.map((skill) => (
                <span key={skill}>
                  {skill}
                </span>
              ))}

            </div>

          </section>

        </div>

        {/* ================= RIGHT COLUMN ================= */}

        <div className="candidate-details-right">

          {/* CONTACT */}

          <section className="candidate-details-card">

            <div className="candidate-card-title">
              <div>
                <h2>Contact Information</h2>
                <p>Candidate contact details</p>
              </div>
            </div>

            <div className="candidate-contact-list">

              <div>
                <Mail size={14} />

                <span>
                  <small>Email</small>
                  {candidate.email}
                </span>

              </div>

              <div>
                <Phone size={14} />

                <span>
                  <small>Phone</small>
                  {candidate.phone}
                </span>

              </div>

              <div>
                <MapPin size={14} />

                <span>
                  <small>Location</small>
                  {candidate.location}
                </span>

              </div>

            </div>

          </section>

          {/* AI EVALUATION */}

          <section className="candidate-ai-card">

            <div className="candidate-ai-header">

              <div>
                <Sparkles size={15} />
                <h2>AI Evaluation</h2>
              </div>

              <span>94% confidence</span>

            </div>

            <div className="candidate-ai-score">

              <strong>94%</strong>

              <div>
                <span>Overall match</span>
                <small>Excellent candidate fit</small>
              </div>

            </div>

            <div className="candidate-ai-progress">
              <span style={{ width: "94%" }} />
            </div>

            <div className="candidate-ai-points">

              <div>
                <CheckCircle2 size={13} />
                <span>Strong skill alignment</span>
              </div>

              <div>
                <CheckCircle2 size={13} />
                <span>Relevant experience</span>
              </div>

              <div>
                <CheckCircle2 size={13} />
                <span>Role requirements matched</span>
              </div>

            </div>

            <button
              className="candidate-ai-review-btn"
              onClick={() =>
                alert(
                  "AI analysis: Sarah Wilson has a 94% match based on skills, experience and role requirements."
                )
              }
            >
              View AI analysis
              <ArrowUpRight size={12} />
            </button>

          </section>

          {/* APPLICATION TIMELINE */}

          <section className="candidate-details-card">

            <div className="candidate-card-title">
              <div>
                <h2>Application Timeline</h2>
                <p>Candidate activity</p>
              </div>
            </div>

            <div className="candidate-timeline">

              <div className="timeline-item">

                <span className="timeline-dot active"></span>

                <div>
                  <strong>{candidateStatus}</strong>
                  <span>2 days ago</span>
                </div>

              </div>

              <div className="timeline-item">

                <span className="timeline-dot"></span>

                <div>
                  <strong>AI evaluation completed</strong>
                  <span>2 days ago</span>
                </div>

              </div>

              <div className="timeline-item">

                <span className="timeline-dot"></span>

                <div>
                  <strong>Application received</strong>
                  <span>2 days ago</span>
                </div>

              </div>

            </div>

          </section>

        </div>

      </div>

    </div>
  );
}

export default CandidateDetails;
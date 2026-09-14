import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import "./ApplicationDetails.css";

const candidateData = {
  "sarah-wilson": {
    name: "Sarah Wilson",
    initials: "SW",
    location: "New York",
    email: "sarah.wilson@email.com",
    phone: "+1 (555) 284-0192",
    position: "Senior Product Designer",
    type: "Full-time",
    experience: "6 yrs",
    match: 94,
    status: "Shortlisted",
    applied: "2 days ago",
    skills: [
      "Product Design",
      "UX Research",
      "Figma",
      "Design Systems",
      "Prototyping",
      "User Testing",
    ],
    strengths: [
      "Strong product design experience",
      "Excellent UX research background",
      "High alignment with role requirements",
    ],
    concerns: [
      "Limited experience in B2B products",
    ],
  },

  "david-chen": {
    name: "David Chen",
    initials: "DC",
    location: "San Francisco",
    email: "david.chen@email.com",
    phone: "+1 (555) 381-0248",
    position: "Senior Frontend Engineer",
    type: "Full-time",
    experience: "5 yrs",
    match: 91,
    status: "Interview",
    applied: "3 days ago",
    skills: [
      "React",
      "TypeScript",
      "JavaScript",
      "Next.js",
      "Node.js",
      "Frontend Architecture",
    ],
    strengths: [
      "Strong React and TypeScript expertise",
      "Excellent frontend architecture knowledge",
      "Relevant senior-level experience",
    ],
    concerns: [
      "Limited management experience",
    ],
  },

  "emily-rodriguez": {
    name: "Emily Rodriguez",
    initials: "ER",
    location: "Austin",
    email: "emily.rodriguez@email.com",
    phone: "+1 (555) 492-0176",
    position: "Product Manager",
    type: "Full-time",
    experience: "7 yrs",
    match: 89,
    status: "Screening",
    applied: "4 days ago",
    skills: [
      "Product Strategy",
      "Roadmapping",
      "Agile",
      "Analytics",
      "Stakeholder Management",
      "Leadership",
    ],
    strengths: [
      "Strong product strategy experience",
      "Excellent stakeholder management",
      "Proven cross-functional leadership",
    ],
    concerns: [
      "Needs deeper technical product experience",
    ],
  },

  "michael-brown": {
    name: "Michael Brown",
    initials: "MB",
    location: "Remote",
    email: "michael.brown@email.com",
    phone: "+1 (555) 631-0284",
    position: "Backend Engineer",
    type: "Full-time",
    experience: "4 yrs",
    match: 87,
    status: "Shortlisted",
    applied: "5 days ago",
    skills: [
      "Node.js",
      "Python",
      "PostgreSQL",
      "AWS",
      "REST APIs",
      "Docker",
    ],
    strengths: [
      "Strong backend development experience",
      "Good cloud infrastructure knowledge",
      "Solid API design experience",
    ],
    concerns: [
      "Limited experience with large-scale distributed systems",
    ],
  },

  "jessica-lee": {
    name: "Jessica Lee",
    initials: "JL",
    location: "Chicago",
    email: "jessica.lee@email.com",
    phone: "+1 (555) 728-0135",
    position: "Data Analyst",
    type: "Full-time",
    experience: "3 yrs",
    match: 84,
    status: "Screening",
    applied: "6 days ago",
    skills: [
      "SQL",
      "Python",
      "Tableau",
      "Excel",
      "Data Visualization",
      "Statistics",
    ],
    strengths: [
      "Strong analytical foundation",
      "Good SQL and visualization skills",
      "Relevant industry experience",
    ],
    concerns: [
      "Limited advanced machine learning experience",
    ],
  },

  "daniel-smith": {
    name: "Daniel Smith",
    initials: "DS",
    location: "Remote",
    email: "daniel.smith@email.com",
    phone: "+1 (555) 814-0162",
    position: "Full Stack Developer",
    type: "Full-time",
    experience: "6 yrs",
    match: 82,
    status: "Rejected",
    applied: "1 week ago",
    skills: [
      "React",
      "Node.js",
      "MongoDB",
      "Express",
      "JavaScript",
      "Git",
    ],
    strengths: [
      "Strong full-stack development experience",
      "Good JavaScript ecosystem knowledge",
    ],
    concerns: [
      "Lower match with current role requirements",
      "Missing several preferred technologies",
    ],
  },
};

function ApplicationDetails() {
  const navigate = useNavigate();
  const { candidateId } = useParams();

  const candidate = candidateData[candidateId];

  if (!candidate) {
    return (
      <div className="application-details-page">
        <div className="application-not-found">
          <FileText size={28} />

          <h2>Application not found</h2>

          <p>
            The candidate application you're looking for doesn't exist.
          </p>

          <button
            onClick={() => navigate("/applications")}
            className="application-back-btn"
          >
            <ArrowLeft size={14} />
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  const statusClass = candidate.status
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <div className="application-details-page">

      {/* ================= TOP BAR ================= */}

      <div className="application-details-topbar">

        <button
          className="application-details-back"
          onClick={() => navigate("/applications")}
        >
          <ArrowLeft size={15} />
          Back to Applications
        </button>

        <div className="application-details-actions">

          <button className="application-secondary-btn">
            <Download size={14} />
            Resume
          </button>

          <button
            className="application-interview-btn"
            onClick={() =>
              navigate(
                `/interviews?candidate=${encodeURIComponent(
                  candidate.name
                )}`
              )
            }
          >
            <CalendarDays size={14} />
            Schedule Interview
          </button>

        </div>

      </div>

      {/* ================= PROFILE HEADER ================= */}

      <section className="application-profile-card">

        <div className="application-profile-main">

          <div className="application-profile-avatar">
            {candidate.initials}
          </div>

          <div className="application-profile-info">

            <div className="application-profile-name-row">

              <h1>{candidate.name}</h1>

              <span
                className={`application-profile-status ${statusClass}`}
              >
                {candidate.status === "Shortlisted" && (
                  <CheckCircle2 size={11} />
                )}

                {candidate.status === "Interview" && (
                  <CalendarDays size={11} />
                )}

                {candidate.status === "Screening" && (
                  <Clock3 size={11} />
                )}

                {candidate.status === "Rejected" && (
                  <XCircle size={11} />
                )}

                {candidate.status}
              </span>

            </div>

            <p className="application-profile-position">
              {candidate.position}
            </p>

            <div className="application-profile-meta">

              <span>
                <MapPin size={12} />
                {candidate.location}
              </span>

              <span>
                <Mail size={12} />
                {candidate.email}
              </span>

              <span>
                <Phone size={12} />
                {candidate.phone}
              </span>

            </div>

          </div>

        </div>

        <div className="application-profile-match">

          <span>AI MATCH</span>

          <strong>{candidate.match}%</strong>

          <small>Excellent match</small>

        </div>

      </section>

      {/* ================= MAIN CONTENT ================= */}

      <div className="application-details-grid">

        {/* ================= LEFT ================= */}

        <div className="application-details-left">

          {/* AI EVALUATION */}

          <section className="application-detail-card">

            <div className="application-detail-header">

              <div>

                <h2>
                  <Sparkles size={16} />
                  AI Evaluation
                </h2>

                <p>
                  Intelligent candidate assessment
                </p>

              </div>

              <span className="application-ai-live">
                <span></span>
                AI ANALYZED
              </span>

            </div>

            <div className="application-score-section">

              <div className="application-score-circle">

                <div>

                  <strong>
                    {candidate.match}
                  </strong>

                  <span>%</span>

                </div>

              </div>

              <div className="application-score-content">

                <h3>
                  Strong candidate match
                </h3>

                <p>
                  AI analysis indicates this candidate
                  aligns strongly with the requirements
                  of the {candidate.position} role.
                </p>

                <div className="application-score-bar">

                  <div
                    style={{
                      width: `${candidate.match}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </section>

          {/* STRENGTHS / CONCERNS */}

          <section className="application-detail-card">

            <div className="application-detail-header">

              <div>

                <h2>
                  Candidate Assessment
                </h2>

                <p>
                  AI-generated strengths and considerations
                </p>

              </div>

            </div>

            <div className="application-assessment-grid">

              <div className="application-assessment strengths">

                <h3>
                  <CheckCircle2 size={14} />
                  Key Strengths
                </h3>

                {candidate.strengths.map((strength) => (
                  <div
                    className="application-assessment-item"
                    key={strength}
                  >
                    <span></span>
                    {strength}
                  </div>
                ))}

              </div>

              <div className="application-assessment concerns">

                <h3>
                  <Clock3 size={14} />
                  Considerations
                </h3>

                {candidate.concerns.map((concern) => (
                  <div
                    className="application-assessment-item"
                    key={concern}
                  >
                    <span></span>
                    {concern}
                  </div>
                ))}

              </div>

            </div>

          </section>

          {/* SKILLS */}

          <section className="application-detail-card">

            <div className="application-detail-header">

              <div>

                <h2>Skills & Expertise</h2>

                <p>
                  Skills identified from candidate profile
                </p>

              </div>

            </div>

            <div className="application-skills">

              {candidate.skills.map((skill) => (
                <span key={skill}>
                  {skill}
                </span>
              ))}

            </div>

          </section>

          {/* APPLICATION TIMELINE */}

          <section className="application-detail-card">

            <div className="application-detail-header">

              <div>

                <h2>Application Timeline</h2>

                <p>
                  Candidate activity and hiring progress
                </p>

              </div>

            </div>

            <div className="application-timeline">

              <TimelineItem
                icon={<FileText size={13} />}
                title="Application received"
                description={`${candidate.name} applied for ${candidate.position}`}
                date={candidate.applied}
                active
              />

              <TimelineItem
                icon={<Sparkles size={13} />}
                title="AI evaluation completed"
                description={`Candidate received a ${candidate.match}% match score`}
                date="1 day ago"
                active
              />

              <TimelineItem
                icon={<CheckCircle2 size={13} />}
                title={
                  candidate.status === "Rejected"
                    ? "Application rejected"
                    : candidate.status === "Screening"
                    ? "Moved to screening"
                    : candidate.status === "Interview"
                    ? "Interview stage"
                    : "Candidate shortlisted"
                }
                description={
                  candidate.status === "Rejected"
                    ? "Candidate application was moved to rejected"
                    : "Application progressed to the next hiring stage"
                }
                date="Today"
                active
              />

            </div>

          </section>

        </div>

        {/* ================= RIGHT ================= */}

        <aside className="application-details-right">

          {/* ROLE CARD */}

          <section className="application-side-card">

            <div className="application-side-title">

              <FileText size={15} />

              <div>

                <h3>Applied Position</h3>

                <span>Job information</span>

              </div>

            </div>

            <div className="application-role-box">

              <strong>
                {candidate.position}
              </strong>

              <span>
                {candidate.type}
              </span>

            </div>

            <div className="application-side-info">

              <div>
                <span>Experience</span>
                <strong>{candidate.experience}</strong>
              </div>

              <div>
                <span>Applied</span>
                <strong>{candidate.applied}</strong>
              </div>

            </div>

          </section>

          {/* ACTION CARD */}

          <section className="application-side-card">

            <div className="application-side-title">

              <UserRound size={15} />

              <div>

                <h3>Recruiter Actions</h3>

                <span>Manage application</span>

              </div>

            </div>

            <div className="application-action-list">

              <button
                onClick={() =>
                  navigate(
                    `/interviews?candidate=${encodeURIComponent(
                      candidate.name
                    )}`
                  )
                }
              >
                <CalendarDays size={14} />
                Schedule Interview
                <ArrowUpRight size={12} />
              </button>

              <button>
                <CheckCircle2 size={14} />
                Move to Shortlist
                <ArrowUpRight size={12} />
              </button>

              <button className="danger">
                <XCircle size={14} />
                Reject Application
                <ArrowUpRight size={12} />
              </button>

            </div>

          </section>

          {/* AI RECOMMENDATION */}

          <section className="application-ai-recommendation">

            <div className="application-ai-recommendation-icon">
              <Sparkles size={17} />
            </div>

            <div>

              <span>AI RECOMMENDATION</span>

              <strong>
                Review this candidate first
              </strong>

              <p>
                Based on skills, experience and role
                requirements, this application is
                highly relevant.
              </p>

            </div>

          </section>

        </aside>

      </div>

    </div>
  );
}

/* ================= TIMELINE ITEM ================= */

function TimelineItem({
  icon,
  title,
  description,
  date,
  active,
}) {
  return (
    <div className="application-timeline-item">

      <div
        className={`application-timeline-icon ${
          active ? "active" : ""
        }`}
      >
        {icon}
      </div>

      <div className="application-timeline-content">

        <div>

          <strong>{title}</strong>

          <span>{date}</span>

        </div>

        <p>{description}</p>

      </div>

    </div>
  );
}

export default ApplicationDetails;
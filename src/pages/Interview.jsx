import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Plus,
  CalendarDays,
  Clock3,
  Users,
  Video,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  BriefcaseBusiness,
} from "lucide-react";

import "./Interview.css";

/* =========================================================
   API
========================================================= */

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

  if (!parts.length) {
    return "NA";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatTime = (dateValue) => {
  if (!dateValue) {
    return "TBD";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDateLabel = (dateValue) => {
  if (!dateValue) {
    return "Upcoming";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Upcoming";
  }

  const today = new Date();

  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const tomorrowStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (
    dateStart.getTime() ===
    todayStart.getTime()
  ) {
    return "Today";
  }

  if (
    dateStart.getTime() ===
    tomorrowStart.getTime()
  ) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getDateNumber = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .getDate()
    .toString()
    .padStart(2, "0");
};

const getDayName = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toLocaleDateString("en-US", {
      weekday: "short",
    })
    .toUpperCase();
};

const formatDuration = (value) => {
  const minutes = Number(value);

  if (!minutes || Number.isNaN(minutes)) {
    return "45 min";
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    if (remaining === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
  }

  return `${minutes} min`;
};

const normalizeStatus = (status) => {
  if (!status) {
    return "Scheduled";
  }

  const normalized = String(status)
    .trim()
    .toLowerCase();

  if (
    normalized === "scheduled" ||
    normalized === "upcoming"
  ) {
    return "Scheduled";
  }

  if (normalized === "completed") {
    return "Completed";
  }

  if (normalized === "cancelled") {
    return "Cancelled";
  }

  if (normalized === "canceled") {
    return "Cancelled";
  }

  return status;
};

const getModeLabel = (item) => {
  const rawMode =
    item.mode ||
    item.interview_mode ||
    item.meeting_type ||
    "";

  if (
    String(rawMode)
      .toLowerCase()
      .includes("video")
  ) {
    return "Video";
  }

  if (
    String(rawMode)
      .toLowerCase()
      .includes("remote")
  ) {
    return "Video";
  }

  return rawMode || "In-person";
};

const getInterviewDateValue = (item) => {
  return (
    item.scheduled_at ||
    item.scheduled_for ||
    item.interview_date ||
    item.start_time ||
    item.date ||
    null
  );
};

const normalizeInterview = (item) => {
  const scheduledAt =
    getInterviewDateValue(item);

  const candidateName =
    item.candidate_name ||
    item.name ||
    "Unknown Candidate";

  const role =
    item.job_title ||
    item.role ||
    item.position ||
    "Unknown Position";

  const interviewer =
    item.interviewer_name ||
    item.interviewer ||
    item.interviewerName ||
    "Hiring Team";

  const match = Number(
    item.ai_match_score ||
      item.match ||
      item.match_score ||
      0
  );

  const mode = getModeLabel(item);

  return {
    id: item.id,

    applicationId:
      item.application_id ||
      item.applicationId,

    candidateId:
      item.candidate_id ||
      item.candidateId,

    initials: getInitials(
      candidateName
    ),

    name: candidateName,

    role,

    scheduledAt,

    date: getDateLabel(
      scheduledAt
    ),

    dateNumber:
      getDateNumber(
        scheduledAt
      ),

    day:
      getDayName(
        scheduledAt
      ),

    time:
      formatTime(
        scheduledAt
      ),

    duration:
      formatDuration(
        item.duration_minutes ||
          item.duration ||
          item.durationMinutes
      ),

    type:
      item.interview_type ||
      item.type ||
      "Interview",

    mode,

    interviewer,

    status:
      normalizeStatus(
        item.status
      ),

    match,

    location:
      item.location ||
      item.interview_location ||
      "",
  };
};

/* =========================================================
   INTERVIEWS
========================================================= */

function Interviews() {
  const navigate = useNavigate();

  const [interviews, setInterviews] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [view, setView] =
    useState("List");

  const [selectedDate, setSelectedDate] =
    useState("Today");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================================
     FETCH INTERVIEWS
  ========================================================= */

  const fetchInterviews =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const token = getAuthToken();

        if (!token) {
          throw new Error(
            "Please sign in to view interviews."
          );
        }

        const response = await apiFetch(
          `${API_URL}/interviews`,
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
              "Unable to load interviews."
          );
        }

        const loadedInterviews =
          Array.isArray(
            data.interviews
          )
            ? data.interviews
            : [];

        setInterviews(
          loadedInterviews.map(
            normalizeInterview
          )
        );
      } catch (err) {
        console.error(
          "Interview loading error:",
          err
        );

        setError(
          err.message ||
            "Unable to load interviews."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  /* =========================================================
     REFRESH WHEN PAGE BECOMES VISIBLE
  ========================================================= */

  useEffect(() => {
    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          fetchInterviews();
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
  }, [fetchInterviews]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredInterviews =
    useMemo(() => {
      let result = [
        ...interviews,
      ];

      if (searchTerm.trim()) {
        const search =
          searchTerm
            .toLowerCase()
            .trim();

        result =
          result.filter((item) =>
            [
              item.name,
              item.role,
              item.type,
              item.interviewer,
              item.mode,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(search)
              )
          );
      }

      if (
        statusFilter !== "All"
      ) {
        result =
          result.filter(
            (item) =>
              item.status ===
              statusFilter
          );
      }

      result.sort((a, b) => {
        const dateA =
          new Date(
            a.scheduledAt || 0
          ).getTime();

        const dateB =
          new Date(
            b.scheduledAt || 0
          ).getTime();

        return dateA - dateB;
      });

      return result;
    }, [
      interviews,
      searchTerm,
      statusFilter,
    ]);

  /* =========================================================
     DATE GROUPS
  ========================================================= */

  const todayInterviews =
    filteredInterviews.filter(
      (item) =>
        item.date === "Today"
    );

  const tomorrowInterviews =
    filteredInterviews.filter(
      (item) =>
        item.date === "Tomorrow"
    );

  const laterInterviews =
    filteredInterviews.filter(
      (item) =>
        item.date !== "Today" &&
        item.date !== "Tomorrow"
    );

  /* =========================================================
     STATS
  ========================================================= */

  const upcomingCount =
    interviews.filter(
      (item) =>
        item.status ===
          "Scheduled" ||
        item.status ===
          "Upcoming"
    ).length;

  const completedCount =
    interviews.filter(
      (item) =>
        item.status ===
        "Completed"
    ).length;

  const todayCount =
    interviews.filter(
      (item) =>
        item.date === "Today"
    ).length;

  const averageMatch =
    interviews.length > 0
      ? (
          interviews.reduce(
            (sum, item) =>
              sum +
              Number(
                item.match || 0
              ),
            0
          ) / interviews.length
        ).toFixed(1)
      : "0.0";

  const highMatchTodayCount =
    todayInterviews.filter(
      (item) =>
        Number(item.match) >= 85
    ).length;

  /* =========================================================
     OPEN INTERVIEW
  ========================================================= */

  const handleInterviewOpen =
    (interview) => {
      const candidateId =
        interview.candidateId ||
        interview.applicationId ||
        interview.id;

      navigate(
        `/applications/${candidateId}`,
        {
          state: {
            candidate: {
              id: candidateId,
              applicationId:
                interview.applicationId,
              candidateId:
                interview.candidateId,
              initials:
                interview.initials,
              name:
                interview.name,
              role:
                interview.role,
              match:
                interview.match,
              status:
                interview.status,
            },

            interview,
          },
        }
      );
    };

  /* =========================================================
     CREATE
  ========================================================= */

  const handleCreateInterview = () => {
    /*
      Backend POST /api/interviews already exists.
      Scheduling UI will be connected once the create modal
      is added; for now we keep the existing interaction.
    */

    alert(
      "Schedule Interview feature is ready for the next step."
    );
  };

  /* =========================================================
     JOIN
  ========================================================= */

  const handleJoinInterview =
    (interview) => {
      if (
        interview.mode ===
        "Video"
      ) {
        alert(
          `Joining ${interview.name}'s interview...`
        );
      } else {
        alert(
          `${interview.name}'s interview is scheduled in-person.`
        );
      }
    };

  /* =========================================================
     RENDER INTERVIEW
  ========================================================= */

  const renderInterview =
    (interview) => (
      <div
        className="interview-row"
        key={interview.id}
      >
        {/* CANDIDATE */}

        <div className="interview-candidate">

          <div className="interview-avatar">
            {interview.initials}
          </div>

          <div className="interview-candidate-info">

            <strong>
              {interview.name}
            </strong>

            <span>
              <BriefcaseBusiness
                size={10}
              />

              {interview.role}
            </span>

          </div>

        </div>

        {/* TIME */}

        <div className="interview-schedule">

          <strong>
            <Clock3 size={13} />

            {interview.time}
          </strong>

          <span>
            {interview.duration}
          </span>

        </div>

        {/* TYPE */}

        <div className="interview-type">

          <strong>
            {interview.type}
          </strong>

          <span>
            {interview.mode ===
            "Video" ? (
              <Video size={11} />
            ) : (
              <MapPin size={11} />
            )}

            {interview.mode}
          </span>

        </div>

        {/* INTERVIEWER */}

        <div className="interview-interviewer">

          <span>
            Interviewer
          </span>

          <strong>
            {interview.interviewer}
          </strong>

        </div>

        {/* AI MATCH */}

        <div className="interview-match">

          <div>
            <Sparkles size={11} />

            {Number(
              interview.match || 0
            ).toFixed(0)}
            %
          </div>

          <span>
            AI Match
          </span>

        </div>

        {/* STATUS */}

        <div className="interview-status-wrapper">

          <span
            className={`interview-status ${interview.status
              .toLowerCase()
              .replace(
                /\s+/g,
                "-"
              )}`}
          >
            <span></span>

            {interview.status}
          </span>

        </div>

        {/* ACTION */}

        <div className="interview-actions">

          {interview.status !==
            "Completed" &&
            interview.status !==
              "Cancelled" && (
              <button
                className="join-interview-btn"
                onClick={() =>
                  handleJoinInterview(
                    interview
                  )
                }
              >
                {interview.mode ===
                "Video"
                  ? "Join"
                  : "Details"}
              </button>
            )}

          <button
            className="interview-open-btn"
            onClick={() =>
              handleInterviewOpen(
                interview
              )
            }
            title="View candidate"
          >
            <ArrowUpRight
              size={14}
            />
          </button>

        </div>

      </div>
    );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="interviews-page">

        <div
          style={{
            minHeight: "420px",
            display: "grid",
            placeItems: "center",
            color: "#759a91",
            fontSize: "11px",
          }}
        >
          Loading interview intelligence...
        </div>

      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="interviews-page">

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

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="interviews-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="interviews-header">

        <div>

          <div className="interviews-eyebrow">
            <span></span>
            INTERVIEW INTELLIGENCE
          </div>

          <h1>
            Interviews
          </h1>

          <p>
            Manage interviews, schedules and
            candidate evaluations from one place.
          </p>

        </div>

        <button
          className="schedule-interview-btn"
          onClick={
            handleCreateInterview
          }
        >
          <Plus size={16} />

          Schedule Interview
        </button>

      </div>

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="interview-stats">

        <div className="interview-stat-card">

          <div className="interview-stat-icon">
            <CalendarDays size={18} />
          </div>

          <div>

            <span>
              Today's Interviews
            </span>

            <strong>
              {todayCount}
            </strong>

            <small>
              <Clock3 size={11} />
              Across all positions
            </small>

          </div>

        </div>

        <div className="interview-stat-card">

          <div className="interview-stat-icon">
            <Users size={18} />
          </div>

          <div>

            <span>
              Upcoming
            </span>

            <strong>
              {upcomingCount}
            </strong>

            <small>
              Next 7 days
            </small>

          </div>

        </div>

        <div className="interview-stat-card">

          <div className="interview-stat-icon">
            <CheckCircle2 size={18} />
          </div>

          <div>

            <span>
              Completed
            </span>

            <strong>
              {completedCount}
            </strong>

            <small>
              This month
            </small>

          </div>

        </div>

        <div className="interview-stat-card">

          <div className="interview-stat-icon">
            <Sparkles size={18} />
          </div>

          <div>

            <span>
              AI Interview Score
            </span>

            <strong>
              {averageMatch}%
            </strong>

            <small>
              Candidate quality
            </small>

          </div>

        </div>

      </div>

      {/* =====================================================
          AI INSIGHT
      ===================================================== */}

      <section className="interview-ai-banner">

        <div className="interview-ai-icon">
          <Sparkles size={19} />
        </div>

        <div className="interview-ai-content">

          <div className="interview-ai-title">

            <strong>
              AI Interview Insight
            </strong>

            <span>
              LIVE RECOMMENDATION
            </span>

          </div>

          <p>
            You have{" "}
            <strong>
              {highMatchTodayCount} high-match
              candidates
            </strong>{" "}
            scheduled today.

            {todayInterviews.length >
              0 && (
              <>
                {" "}
                {todayInterviews[0].name} has
                the highest current AI match
                among today's interviews at{" "}
                <strong>
                  {Number(
                    todayInterviews[0].match ||
                      0
                  ).toFixed(0)}
                  %
                </strong>
                .
              </>
            )}
          </p>

        </div>

        <button
          onClick={() => {
            if (
              todayInterviews.length
            ) {
              handleInterviewOpen(
                todayInterviews[0]
              );
            }
          }}
        >
          Review candidate

          <ArrowUpRight
            size={13}
          />

        </button>

      </section>

      {/* =====================================================
          CONTROLS
      ===================================================== */}

      <section className="interviews-section">

        <div className="interviews-section-header">

          <div>

            <h2>
              Interview Schedule
            </h2>

            <p>
              Your hiring team's upcoming
              conversations
            </p>

          </div>

          <div className="interviews-controls">

            {/* SEARCH */}

            <div className="interview-search">

              <Search size={15} />

              <input
                type="text"
                placeholder="Search interviews..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />

            </div>

            {/* FILTER */}

            <div className="interview-filter-wrapper">

              <button
                className="interview-filter-btn"
                onClick={() =>
                  setFilterOpen(
                    !filterOpen
                  )
                }
              >

                <Filter size={14} />

                Filter

                <ChevronDown
                  size={12}
                />

              </button>

              {filterOpen && (
                <div className="interview-filter-menu">

                  {[
                    "All",
                    "Scheduled",
                    "Upcoming",
                    "Completed",
                    "Cancelled",
                  ].map(
                    (status) => (
                      <button
                        key={status}
                        className={
                          statusFilter ===
                          status
                            ? "active"
                            : ""
                        }
                        onClick={() => {
                          setStatusFilter(
                            status
                          );

                          setFilterOpen(
                            false
                          );
                        }}
                      >
                        {status}
                      </button>
                    )
                  )}

                </div>
              )}

            </div>

            {/* VIEW */}

            <div className="interview-view-toggle">

              <button
                className={
                  view === "List"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setView("List")
                }
              >
                List
              </button>

              <button
                className={
                  view === "Calendar"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setView(
                    "Calendar"
                  )
                }
              >
                Calendar
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            DATE NAVIGATION
        ================================================= */}

        <div className="interview-date-nav">

          <button>
            <ChevronLeft size={15} />
          </button>

          {(() => {
            const dateGroups =
              [];

            const seen =
              new Set();

            interviews.forEach(
              (item) => {
                const key =
                  item.date;

                if (
                  !seen.has(key)
                ) {
                  seen.add(key);

                  dateGroups.push(
                    item
                  );
                }
              }
            );

            return dateGroups
              .slice(0, 4)
              .map((item) => (
                <div
                  key={
                    item.id
                  }
                  className={
                    selectedDate ===
                    item.date
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedDate(
                      item.date
                    )
                  }
                >
                  <strong>
                    {item.dateNumber ||
                      "--"}
                  </strong>

                  <span>
                    {item.day ||
                      "---"}
                  </span>

                </div>
              ));
          })()}

          <button>
            <ChevronRight size={15} />
          </button>

        </div>

        {/* =================================================
            LIST VIEW
        ================================================= */}

        {view === "List" ? (
          <>

            <div className="interview-table-header">

              <span>
                Candidate
              </span>

              <span>
                Time
              </span>

              <span>
                Interview Type
              </span>

              <span>
                Interviewer
              </span>

              <span>
                AI Match
              </span>

              <span>
                Status
              </span>

              <span></span>

            </div>

            {/* TODAY */}

            {todayInterviews.length >
              0 && (
              <div className="interview-day-group">

                <div className="interview-day-heading">

                  <span>
                    Today
                  </span>

                  <strong>
                    {
                      todayInterviews.length
                    }{" "}
                    interviews
                  </strong>

                </div>

                {todayInterviews.map(
                  renderInterview
                )}

              </div>
            )}

            {/* TOMORROW */}

            {tomorrowInterviews.length >
              0 && (
              <div className="interview-day-group">

                <div className="interview-day-heading">

                  <span>
                    Tomorrow
                  </span>

                  <strong>
                    {
                      tomorrowInterviews.length
                    }{" "}
                    interviews
                  </strong>

                </div>

                {tomorrowInterviews.map(
                  renderInterview
                )}

              </div>
            )}

            {/* LATER */}

            {laterInterviews.length >
              0 && (
              <div className="interview-day-group">

                <div className="interview-day-heading">

                  <span>
                    Upcoming
                  </span>

                  <strong>
                    {
                      laterInterviews.length
                    }{" "}
                    interviews
                  </strong>

                </div>

                {laterInterviews.map(
                  renderInterview
                )}

              </div>
            )}

            {filteredInterviews.length ===
              0 && (
              <div className="interviews-empty">

                <CalendarDays
                  size={28}
                />

                <strong>
                  No interviews found
                </strong>

                <span>
                  Try changing your
                  search or filter.
                </span>

              </div>
            )}

          </>
        ) : (

          /* =================================================
             CALENDAR VIEW
          ================================================= */

          <div className="interview-calendar">

            {[
              "09:00 AM",
              "10:00 AM",
              "11:00 AM",
              "12:00 PM",
              "01:00 PM",
              "02:00 PM",
              "03:00 PM",
              "04:00 PM",
              "05:00 PM",
            ].map((time) => (

              <div
                className="calendar-row"
                key={time}
              >

                <span className="calendar-time">
                  {time}
                </span>

                <div className="calendar-slot">

                  {filteredInterviews
                    .filter(
                      (item) =>
                        item.date ===
                          selectedDate
                    )
                    .filter(
                      (item) =>
                        item.time ===
                        time
                    )
                    .map(
                      (item) => (
                        <button
                          className="calendar-interview"
                          key={item.id}
                          onClick={() =>
                            handleInterviewOpen(
                              item
                            )
                          }
                        >

                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.role}
                          </span>

                          <small>
                            {item.type}
                          </small>

                        </button>
                      )
                    )}

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

      {/* =====================================================
          BOTTOM INSIGHTS
      ===================================================== */}

      <div className="interview-insights">

        <div className="interview-insight-card">

          <div className="interview-insight-icon">
            <UserCheck size={16} />
          </div>

          <div>

            <strong>
              Interview Readiness
            </strong>

            <span>
              {upcomingCount} candidates are
              ready for interviews
            </span>

          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

        <div className="interview-insight-card">

          <div className="interview-insight-icon">
            <Sparkles size={16} />
          </div>

          <div>

            <strong>
              AI Evaluation
            </strong>

            <span>
              {averageMatch}% average
              confidence across interviews
            </span>

          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

        <div className="interview-insight-card">

          <div className="interview-insight-icon">
            <AlertCircle size={16} />
          </div>

          <div>

            <strong>
              Action Required
            </strong>

            <span>
              Interview feedback workflow
              is connected to scheduled interviews
            </span>

          </div>

          <ArrowUpRight
            size={14}
          />

        </div>

      </div>

    </div>
  );
}

export default Interviews;
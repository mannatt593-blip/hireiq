import {
  ArrowDownRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "./Analytics.css";

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

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatNumber = (value) => {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(toNumber(value));
};

const formatCompact = (value) => {
  const number = toNumber(value);

  if (number >= 1000000) {
    return `${(
      number / 1000000
    ).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(
      number / 1000
    ).toFixed(1)}K`;
  }

  return formatNumber(number);
};

const getHeaders = () => {
  const token =
    getAuthToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type":
      "application/json",
  };
};

/* =========================================================
   NORMALIZE DASHBOARD RESPONSE
   BACKEND RESPONSE:

   {
     success: true,
     overview: {
       jobs: {...},
       candidates: {...},
       applications: {...},
       interviews: {...},
       ai: {...}
     },
     top_candidates: [],
     recent_applications: [],
     pipeline: []
   }
========================================================= */

const normalizeDashboard = (
  response
) => {
  const overview =
    response?.overview || {};

  const jobs =
    overview.jobs || {};

  const candidates =
    overview.candidates || {};

  const applications =
    overview.applications || {};

  const interviews =
    overview.interviews || {};

  const ai =
    overview.ai || {};

  const pipelineRows =
    Array.isArray(
      response?.pipeline
    )
      ? response.pipeline
      : [];

  const pipelineMap =
    pipelineRows.reduce(
      (acc, item) => {
        if (item?.status) {
          acc[item.status] =
            toNumber(
              item.count
            );
        }

        return acc;
      },
      {}
    );

  return {
    jobs: {
      total: toNumber(
        jobs.total_jobs
      ),

      active: toNumber(
        jobs.active_jobs
      ),
    },

    candidates: {
      total: toNumber(
        candidates.total_candidates
      ),

      available: toNumber(
        candidates.available_candidates
      ),

      shortlisted: toNumber(
        candidates.shortlisted_candidates
      ),
    },

    applications: {
      total: toNumber(
        applications.total_applications
      ),

      screening: toNumber(
        applications.screening_count
      ),

      shortlisted: toNumber(
        applications.shortlisted_count
      ),

      interviewScheduled:
        toNumber(
          applications.interview_scheduled_count
        ),

      selected: toNumber(
        applications.selected_count
      ),

      rejected: toNumber(
        applications.rejected_count
      ),
    },

    interviews: {
      total: toNumber(
        interviews.total_interviews
      ),

      scheduled: toNumber(
        interviews.scheduled_interviews
      ),

      completed: toNumber(
        interviews.completed_interviews
      ),

      cancelled: toNumber(
        interviews.cancelled_interviews
      ),
    },

    ai: {
      totalScreenings:
        toNumber(
          ai.total_screenings
        ),

      averageMatch:
        toNumber(
          ai.average_match_score
        ),

      strongMatches:
        toNumber(
          ai.strong_matches
        ),

      goodMatches:
        toNumber(
          ai.good_matches
        ),

      reviewMatches:
        toNumber(
          ai.review_matches
        ),
    },

    pipelineMap,
  };
};

/* =========================================================
   NORMALIZE HIRING TRENDS

   BACKEND:

   {
     success: true,
     trends: [
       {
         month,
         applications,
         selected,
         rejected
       }
     ]
   }
========================================================= */

const normalizeHiringTrends = (
  response
) => {
  const trends =
    Array.isArray(
      response?.trends
    )
      ? response.trends
      : [];

  return trends.map(
    (item) => ({
      month:
        item.month || "—",

      applications:
        toNumber(
          item.applications
        ),

      hired:
        toNumber(
          item.selected
        ),

      rejected:
        toNumber(
          item.rejected
        ),
    })
  );
};

/* =========================================================
   ANALYTICS
========================================================= */

function Analytics() {
  const navigate =
    useNavigate();

  const [period, setPeriod] =
    useState("6");

  const [dashboard, setDashboard] =
    useState(null);

  const [hiringData, setHiringData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchAnalytics =
    useCallback(
      async (
        selectedPeriod
      ) => {
        try {
          setLoading(true);
          setError("");

          const token =
            getAuthToken();

          if (!token) {
            throw new Error(
              "Please sign in to view analytics."
            );
          }

          const headers =
            getHeaders();

          const [
            dashboardResponse,
            trendResponse,
          ] =
            await Promise.all([
              apiFetch(
                `${API_URL}/analytics/dashboard`,
                {
                  method: "GET",
                  headers,
                }
              ),

              apiFetch(
                `${API_URL}/analytics/hiring-trends?months=${selectedPeriod}`,
                {
                  method: "GET",
                  headers,
                }
              ),
            ]);

          const dashboardData =
            await dashboardResponse.json();

          const trendData =
            await trendResponse.json();

          if (
            !dashboardResponse.ok
          ) {
            throw new Error(
              dashboardData.message ||
                "Unable to load dashboard analytics."
            );
          }

          if (
            !trendResponse.ok
          ) {
            throw new Error(
              trendData.message ||
                "Unable to load hiring trends."
            );
          }

          setDashboard(
            normalizeDashboard(
              dashboardData
            )
          );

          setHiringData(
            normalizeHiringTrends(
              trendData
            )
          );
        } catch (err) {
          console.error(
            "Analytics loading error:",
            err
          );

          setError(
            err.message ||
              "Unable to load analytics."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    fetchAnalytics(
      period
    );
  }, [
    period,
    fetchAnalytics,
  ]);

  /* =======================================================
     REFRESH
  ======================================================= */

  useEffect(() => {
    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          fetchAnalytics(
            period
          );
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
  }, [
    fetchAnalytics,
    period,
  ]);

  /* =======================================================
     SAFE DATA
  ======================================================= */

  const stats =
    dashboard || {
      jobs: {
        total: 0,
        active: 0,
      },

      candidates: {
        total: 0,
        available: 0,
        shortlisted: 0,
      },

      applications: {
        total: 0,
        screening: 0,
        shortlisted: 0,
        interviewScheduled: 0,
        selected: 0,
        rejected: 0,
      },

      interviews: {
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
      },

      ai: {
        totalScreenings: 0,
        averageMatch: 0,
        strongMatches: 0,
        goodMatches: 0,
        reviewMatches: 0,
      },

      pipelineMap: {},
    };

  /* =======================================================
     CURRENT COUNTS
  ======================================================= */

  const applicationTotal =
    stats.applications.total;

  const screeningCount =
    stats.applications.screening;

  const shortlistedCount =
    stats.applications
      .shortlisted;

  const interviewCount =
    stats.applications
      .interviewScheduled;

  const selectedCount =
    stats.applications.selected;

  const rejectedCount =
    stats.applications.rejected;

  const aiScreenings =
    stats.ai.totalScreenings;

  const averageMatch =
    stats.ai.averageMatch;

  const strongMatches =
    stats.ai.strongMatches;

  /* =======================================================
     APPLICATION MIX
  ======================================================= */

  const applicationMix =
    useMemo(() => {
      if (
        applicationTotal <= 0
      ) {
        return [
          {
            name:
              "No applications",
            value: 100,
          },
        ];
      }

      const rawRows = [
        {
          name: "Screening",
          value:
            screeningCount,
        },

        {
          name: "Shortlisted",
          value:
            shortlistedCount,
        },

        {
          name: "Interview",
          value:
            interviewCount,
        },

        {
          name: "Rejected",
          value:
            rejectedCount,
        },

        {
          name: "Selected",
          value:
            selectedCount,
        },
      ];

      return rawRows
        .filter(
          (item) =>
            item.value > 0
        )
        .map(
          (item) => ({
            ...item,
            value: Math.round(
              (item.value /
                applicationTotal) *
                100
            ),
          })
        );
    }, [
      applicationTotal,
      screeningCount,
      shortlistedCount,
      interviewCount,
      rejectedCount,
      selectedCount,
    ]);

  /* =======================================================
     DONUT
  ======================================================= */

  const donutGradient =
    useMemo(() => {
      const colors = [
        "#8EB69B",
        "#6FBF9F",
        "#4D9C83",
        "#347461",
        "#235347",
      ];

      let current = 0;

      const stops =
        applicationMix.map(
          (item, index) => {
            const start =
              current;

            current +=
              item.value;

            const end =
              current;

            return `${colors[index % colors.length]} ${start}% ${end}%`;
          }
        );

      return `conic-gradient(${stops.join(
        ", "
      )})`;
    }, [applicationMix]);

  /* =======================================================
     FUNNEL
  ======================================================= */

  const funnelData =
    useMemo(() => {
      const total =
        applicationTotal;

      const safeTotal =
        Math.max(
          total,
          1
        );

      const screened =
        Math.max(
          aiScreenings,
          screeningCount +
            shortlistedCount +
            interviewCount +
            selectedCount
        );

      const interviewValue =
        Math.max(
          stats.interviews
            .total,
          interviewCount
        );

      const stages = [
        {
          label:
            "Applications",
          value: total,
        },

        {
          label:
            "Screened",
          value:
            screened,
        },

        {
          label:
            "Shortlisted",
          value:
            shortlistedCount,
        },

        {
          label:
            "Interviews",
          value:
            interviewValue,
        },

        {
          label:
            "Hired",
          value:
            selectedCount,
        },
      ];

      return stages.map(
        (stage) => {
          const percentage =
            total > 0
              ? (stage.value /
                  safeTotal) *
                100
              : 0;

          return {
            ...stage,

            percentage:
              `${percentage.toFixed(
                1
              )}%`,

            width:
              percentage > 0
                ? `${Math.max(
                    8,
                    Math.min(
                      100,
                      percentage
                    )
                  )}%`
                : "0%",
          };
        }
      );
    }, [
      applicationTotal,
      aiScreenings,
      screeningCount,
      shortlistedCount,
      interviewCount,
      selectedCount,
      stats.interviews.total,
    ]);

  /* =======================================================
     CHART SCALE
  ======================================================= */

  const chartMax =
    Math.max(
      ...hiringData.map(
        (item) =>
          item.applications
      ),
      1
    );

  /* =======================================================
     GROWTH
  ======================================================= */

  const growth =
    useMemo(() => {
      if (
        hiringData.length <
        2
      ) {
        return 0;
      }

      const first =
        hiringData[0]
          .applications;

      const last =
        hiringData[
          hiringData.length - 1
        ].applications;

      if (!first) {
        return 0;
      }

      return (
        ((last - first) /
          first) *
        100
      );
    }, [hiringData]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="analytics-page">

        <div
          style={{
            minHeight:
              "500px",
            display:
              "grid",
            placeItems:
              "center",
            color:
              "#759A91",
            fontSize:
              "11px",
          }}
        >
          Loading recruitment analytics...
        </div>

      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <div className="analytics-page">

        <div
          style={{
            padding:
              "18px",
            borderRadius:
              "12px",
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
    <div className="analytics-page">

      {/* ================= HEADER ================= */}

      <div className="analytics-header">

        <div>

          <div className="analytics-eyebrow">
            <span></span>
            RECRUITMENT ANALYTICS
          </div>

          <h1>
            Analytics
          </h1>

          <p>
            Track hiring performance,
            candidate quality and
            recruitment efficiency.
          </p>

        </div>

        <div className="analytics-header-actions">

          <select
            className="analytics-period-select"
            value={period}
            onChange={(event) =>
              setPeriod(
                event.target.value
              )
            }
          >
            <option value="6">
              Last 6 months
            </option>

            <option value="3">
              Last 3 months
            </option>

            <option value="12">
              Last 12 months
            </option>
          </select>

        </div>

      </div>

      {/* ================= STATS ================= */}

      <div className="analytics-stats">

        <AnalyticsStat
          icon={
            <Users size={18} />
          }
          label="Total Candidates"
          value={formatNumber(
            stats.candidates
              .total
          )}
          change="LIVE"
          positive
          text="from PostgreSQL"
        />

        <AnalyticsStat
          icon={
            <BriefcaseBusiness
              size={18}
            />
          }
          label="Active Jobs"
          value={formatNumber(
            stats.jobs.active
          )}
          change="LIVE"
          positive
          text="currently open"
        />

        <AnalyticsStat
          icon={
            <CheckCircle2
              size={18}
            />
          }
          label="Hires"
          value={formatNumber(
            selectedCount
          )}
          change="LIVE"
          positive
          text="selected candidates"
        />

        <AnalyticsStat
          icon={
            <Clock3 size={18} />
          }
          label="Avg. AI Match"
          value={`${averageMatch.toFixed(
            1
          )}%`}
          change={formatNumber(
            aiScreenings
          )}
          positive
          text="AI screenings"
        />

      </div>

      {/* ================= AI INSIGHT ================= */}

      <section className="analytics-ai-banner">

        <div className="analytics-ai-icon">
          <Sparkles size={19} />
        </div>

        <div className="analytics-ai-content">

          <div className="analytics-ai-title">

            <strong>
              AI Hiring Insight
            </strong>

            <span>
              LIVE ANALYSIS
            </span>

          </div>

          <p>
            AI has evaluated{" "}
            <b>
              {formatNumber(
                aiScreenings
              )} applications
            </b>{" "}
            with an average match
            score of{" "}
            <b>
              {averageMatch.toFixed(
                1
              )}%
            </b>
            {strongMatches >
              0 && (
              <>
                {" "}
                and identified{" "}
                <b>
                  {formatNumber(
                    strongMatches
                  )} strong matches
                </b>
                .
              </>
            )}
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/applications"
            )
          }
        >
          View AI insights

          <ArrowUpRight
            size={13}
          />

        </button>

      </section>

      {/* ================= MAIN GRID ================= */}

      <div className="analytics-main-grid">

        {/* HIRING PERFORMANCE */}

        <section className="analytics-card analytics-chart-card">

          <div className="analytics-card-header">

            <div>

              <h2>
                Hiring Performance
              </h2>

              <p>
                Applications and selected candidates
              </p>

            </div>

            <span className="analytics-growth-badge">

              <TrendingUp size={12} />

              {growth >= 0
                ? "+"
                : ""}
              {growth.toFixed(
                1
              )}%

            </span>

          </div>

          <div className="analytics-chart">

            <div className="chart-y-axis">

              <span>
                {formatCompact(
                  chartMax
                )}
              </span>

              <span>
                {formatCompact(
                  chartMax *
                    0.75
                )}
              </span>

              <span>
                {formatCompact(
                  chartMax *
                    0.5
                )}
              </span>

              <span>
                {formatCompact(
                  chartMax *
                    0.25
                )}
              </span>

              <span>
                0
              </span>

            </div>

            <div className="chart-area">

              <div className="chart-grid-lines">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="chart-bars">

                {hiringData.length >
                0 ? (
                  hiringData.map(
                    (item) => (
                      <div
                        className="chart-column"
                        key={
                          item.month
                        }
                      >

                        <div className="chart-bar-group">

                          <div
                            className="chart-bar applications-bar"
                            style={{
                              height: `${Math.max(
                                (
                                  item.applications /
                                  chartMax
                                ) *
                                  100,
                                4
                              )}%`,
                            }}
                          >
                            <span>
                              {
                                item.applications
                              }
                            </span>
                          </div>

                          <div
                            className="chart-bar hired-bar"
                            style={{
                              height: `${Math.max(
                                item.hired
                                  ? (
                                      item.hired /
                                      chartMax
                                    ) *
                                    100
                                  : 0,
                                item.hired
                                  ? 4
                                  : 0
                              )}%`,
                            }}
                          >
                            <span>
                              {
                                item.hired
                              }
                            </span>
                          </div>

                        </div>

                        <small>
                          {item.month}
                        </small>

                      </div>
                    )
                  )
                ) : (
                  <div
                    style={{
                      width:
                        "100%",
                      minHeight:
                        "160px",
                      display:
                        "grid",
                      placeItems:
                        "center",
                      color:
                        "#759A91",
                      fontSize:
                        "10px",
                    }}
                  >
                    No hiring trend data available yet.
                  </div>
                )}

              </div>

            </div>

          </div>

          <div className="analytics-chart-legend">

            <span>
              <i className="legend-applications"></i>
              Applications
            </span>

            <span>
              <i className="legend-hired"></i>
              Selected
            </span>

          </div>

        </section>

        {/* APPLICATION MIX */}

        <section className="analytics-card source-card">

          <div className="analytics-card-header">

            <div>

              <h2>
                Application Mix
              </h2>

              <p>
                Current application distribution
              </p>

            </div>

            <button
              type="button"
              className="analytics-more-btn"
              onClick={() =>
                navigate(
                  "/applications"
                )
              }
            >
              View details

              <ArrowUpRight
                size={12}
              />

            </button>

          </div>

          <div className="source-content">

            <div
              className="source-donut"
              style={{
                background:
                  donutGradient,
              }}
            >

              <div className="source-donut-inner">

                <strong>
                  {formatCompact(
                    applicationTotal
                  )}
                </strong>

                <span>
                  Applications
                </span>

              </div>

            </div>

            <div className="source-list">

              {applicationMix.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="source-item"
                    key={
                      item.name
                    }
                  >

                    <div className="source-name">

                      <span
                        className={`source-dot source-${index}`}
                      ></span>

                      <span>
                        {
                          item.name
                        }
                      </span>

                    </div>

                    <strong>
                      {item.value}%
                    </strong>

                  </div>
                )
              )}

            </div>

          </div>

        </section>

      </div>

      {/* ================= LOWER GRID ================= */}

      <div className="analytics-lower-grid">

        {/* HIRING FUNNEL */}

        <section className="analytics-card funnel-card">

          <div className="analytics-card-header">

            <div>

              <h2>
                Hiring Funnel
              </h2>

              <p>
                Candidate conversion across stages
              </p>

            </div>

            <button
              type="button"
              className="analytics-more-btn"
              onClick={() =>
                navigate(
                  "/applications"
                )
              }
            >
              Full report

              <ArrowUpRight
                size={12}
              />

            </button>

          </div>

          <div className="analytics-funnel">

            {funnelData.map(
              (item) => (
                <FunnelRow
                  key={
                    item.label
                  }
                  label={
                    item.label
                  }
                  value={formatNumber(
                    item.value
                  )}
                  percentage={
                    item.percentage
                  }
                  width={
                    item.width
                  }
                />
              )
            )}

          </div>

        </section>

        {/* RECRUITMENT METRICS */}

        <section className="analytics-card metrics-card">

          <div className="analytics-card-header">

            <div>

              <h2>
                Recruitment Metrics
              </h2>

              <p>
                Key performance indicators
              </p>

            </div>

          </div>

          <div className="metric-row">

            <div className="metric-icon">
              <CalendarDays
                size={15}
              />
            </div>

            <div className="metric-info">

              <span>
                Scheduled Interviews
              </span>

              <strong>
                {formatNumber(
                  stats.interviews
                    .scheduled
                )}
              </strong>

            </div>

            <div className="metric-change positive">
              <ArrowUpRight
                size={12}
              />
              LIVE
            </div>

          </div>

          <div className="metric-row">

            <div className="metric-icon">
              <Users size={15} />
            </div>

            <div className="metric-info">

              <span>
                Interview Conversion
              </span>

              <strong>
                {applicationTotal
                  ? (
                      (stats.interviews
                        .total /
                        applicationTotal) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </strong>

            </div>

            <div className="metric-change positive">
              <ArrowUpRight
                size={12}
              />
              LIVE
            </div>

          </div>

          <div className="metric-row">

            <div className="metric-icon">
              <Sparkles
                size={15}
              />
            </div>

            <div className="metric-info">

              <span>
                AI Match Score
              </span>

              <strong>
                {averageMatch.toFixed(
                  1
                )}%
              </strong>

            </div>

            <div className="metric-change positive">
              <ArrowUpRight
                size={12}
              />
              LIVE
            </div>

          </div>

          <div className="metric-row">

            <div className="metric-icon">
              <BriefcaseBusiness
                size={15}
              />
            </div>

            <div className="metric-info">

              <span>
                Active Jobs
              </span>

              <strong>
                {formatNumber(
                  stats.jobs.active
                )}
              </strong>

            </div>

            <div className="metric-change positive">
              <ArrowUpRight
                size={12}
              />
              LIVE
            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

/* =========================================================
   STAT
========================================================= */

function AnalyticsStat({
  icon,
  label,
  value,
  change,
  positive,
  text,
}) {
  return (
    <div className="analytics-stat-card">

      <div className="analytics-stat-icon">
        {icon}
      </div>

      <div className="analytics-stat-content">

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small
          className={
            positive
              ? "positive"
              : "negative"
          }
        >
          {change} {text}
        </small>

      </div>

    </div>
  );
}

/* =========================================================
   FUNNEL ROW
========================================================= */

function FunnelRow({
  label,
  value,
  percentage,
  width,
}) {
  return (
    <div className="funnel-row">

      <div className="funnel-row-top">

        <span>
          {label}
        </span>

        <div>

          <strong>
            {value}
          </strong>

          <small>
            {percentage}
          </small>

        </div>

      </div>

      <div className="funnel-track">

        <div
          className="funnel-fill"
          style={{
            width:
              width ||
              "0%",
          }}
        />

      </div>

    </div>
  );
}

export default Analytics;
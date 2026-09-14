import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Bell,
  Moon,
  Sun,
  Command,
  Plus,
  Check,
  Trash2,
  CalendarDays,
  Sparkles,
  Info,
  BriefcaseBusiness,
  UserPlus,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

/* =========================================================
   AUTH
========================================================= */

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

/* =========================================================
   HELPERS
========================================================= */

const formatNotificationTime = (dateValue) => {
  if (!dateValue) {
    return "Just now";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffMs = Math.max(
    0,
    Date.now() - date.getTime()
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

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const normalizeNotification = (notification) => {
  return {
    id: notification.id,

    title:
      notification.title ||
      "HireIQ Notification",

    message:
      notification.message ||
      notification.body ||
      "",

    type:
      notification.type ||
      notification.notification_type ||
      "info",

    read: Boolean(
      notification.is_read ??
        notification.read
    ),

    createdAt:
      notification.created_at ||
      notification.createdAt ||
      null,
  };
};

/* =========================================================
   TOPBAR
========================================================= */

function Topbar() {
  const navigate = useNavigate();

  const [isLight, setIsLight] =
    useState(() => {
      return (
        localStorage.getItem(
          "hireiq-theme"
        ) === "light"
      );
    });

  const [notifications, setNotifications] =
    useState([]);

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [newMenuOpen, setNewMenuOpen] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const [searchValue, setSearchValue] =
    useState("");

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const notificationButtonRef =
    useRef(null);

  const newButtonRef =
    useRef(null);

  const userButtonRef =
    useRef(null);

  /* =======================================================
     THEME
  ======================================================= */

  useEffect(() => {
    document.body.classList.toggle(
      "light-mode",
      isLight
    );

    localStorage.setItem(
      "hireiq-theme",
      isLight ? "light" : "dark"
    );
  }, [isLight]);

  const toggleTheme = () => {
    setIsLight((prev) => !prev);
  };

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const fetchNotifications =
    useCallback(async () => {
      try {
        const token =
          getAuthToken();

        if (!token) {
          return;
        }

        setNotificationLoading(true);

        const response =
          await fetch(
            `${API_URL}/notifications`,
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
              "Unable to load notifications."
          );
        }

        const list =
          Array.isArray(
            data.notifications
          )
            ? data.notifications
            : [];

        setNotifications(
          list.map(
            normalizeNotification
          )
        );
      } catch (error) {
        console.error(
          "Notification loading error:",
          error
        );
      } finally {
        setNotificationLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchNotifications();
      }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const unreadCount =
    useMemo(() => {
      return notifications.filter(
        (item) => !item.read
      ).length;
    }, [notifications]);

  const handleBellClick = async () => {
    setNotificationOpen(
      (prev) => !prev
    );

    setNewMenuOpen(false);
    setUserMenuOpen(false);

    await fetchNotifications();
  };

  const markAsRead = async (
    notificationId
  ) => {
    try {
      const token =
        getAuthToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_URL}/notifications/${notificationId}/read`,
          {
            method: "PATCH",
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
            "Unable to mark notification as read."
        );
      }

      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notificationId
                ? {
                    ...item,
                    read: true,
                  }
                : item
          )
      );
    } catch (error) {
      console.error(
        "Mark read error:",
        error
      );
    }
  };

  const markAllAsRead =
    async () => {
      try {
        const token =
          getAuthToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_URL}/notifications/read-all`,
            {
              method: "PATCH",
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
              "Unable to mark notifications as read."
          );
        }

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                read: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "Mark all read error:",
          error
        );
      }
    };

  const deleteNotification =
    async (
      notificationId
    ) => {
      try {
        const token =
          getAuthToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_URL}/notifications/${notificationId}`,
            {
              method: "DELETE",
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
              "Unable to delete notification."
          );
        }

        setNotifications(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                notificationId
            )
        );
      } catch (error) {
        console.error(
          "Delete notification error:",
          error
        );
      }
    };

  /* =======================================================
     NOTIFICATION ICON
  ======================================================= */

  const getNotificationIcon =
    (type) => {
      const value =
        String(type || "")
          .toLowerCase();

      if (
        value.includes(
          "interview"
        )
      ) {
        return (
          <CalendarDays
            size={14}
          />
        );
      }

      if (
        value.includes("ai") ||
        value.includes("screen")
      ) {
        return (
          <Sparkles
            size={14}
          />
        );
      }

      return (
        <Info size={14} />
      );
    };

  /* =======================================================
     NEW MENU
  ======================================================= */

  const openNewMenu = () => {
    setNewMenuOpen(
      (prev) => !prev
    );

    setNotificationOpen(false);
    setUserMenuOpen(false);
  };

  const handleNewAction = (
    route
  ) => {
    setNewMenuOpen(false);
    navigate(route);
  };

  /* =======================================================
     USER MENU
  ======================================================= */

  const openUserMenu = () => {
    setUserMenuOpen(
      (prev) => !prev
    );

    setNotificationOpen(false);
    setNewMenuOpen(false);
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "hireiq_token"
    );

    localStorage.removeItem(
      "hireiqToken"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "hireiq_user"
    );

    sessionStorage.removeItem(
      "hireiq_token"
    );

    sessionStorage.removeItem(
      "token"
    );

    setUserMenuOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const handleSearchSubmit = (
    event
  ) => {
    event.preventDefault();

    const query =
      searchValue.trim();

    if (!query) {
      return;
    }

    navigate(
      `/candidates?search=${encodeURIComponent(
        query
      )}`
    );
  };

  /* =======================================================
     ESCAPE
  ======================================================= */

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setNotificationOpen(
          false
        );

        setNewMenuOpen(
          false
        );

        setUserMenuOpen(
          false
        );
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =======================================================
     OUTSIDE CLICK
  ======================================================= */

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        notificationOpen &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(
          event.target
        )
      ) {
        const panel =
          document.getElementById(
            "hireiq-notification-panel"
          );

        if (
          panel &&
          !panel.contains(
            event.target
          )
        ) {
          setNotificationOpen(
            false
          );
        }
      }

      if (
        newMenuOpen &&
        newButtonRef.current &&
        !newButtonRef.current.contains(
          event.target
        )
      ) {
        const panel =
          document.getElementById(
            "hireiq-new-menu"
          );

        if (
          panel &&
          !panel.contains(
            event.target
          )
        ) {
          setNewMenuOpen(
            false
          );
        }
      }

      if (
        userMenuOpen &&
        userButtonRef.current &&
        !userButtonRef.current.contains(
          event.target
        )
      ) {
        const panel =
          document.getElementById(
            "hireiq-user-menu"
          );

        if (
          panel &&
          !panel.contains(
            event.target
          )
        ) {
          setUserMenuOpen(
            false
          );
        }
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [
    notificationOpen,
    newMenuOpen,
    userMenuOpen,
  ]);

  /* =======================================================
     NOTIFICATION PORTAL
  ======================================================= */

  const notificationPortal =
    notificationOpen &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            id="hireiq-notification-panel"
            style={{
              position: "fixed",
              top: "72px",
              right: "28px",
              width: "370px",
              maxWidth:
                "calc(100vw - 24px)",
              zIndex: 999999,
              borderRadius: "15px",
              overflow: "hidden",
              background:
                isLight
                  ? "#ffffff"
                  : "#0B2B26",
              border: isLight
                ? "1px solid #dcebe6"
                : "1px solid rgba(142,182,155,.22)",
              boxShadow:
                "0 24px 60px rgba(0,0,0,.45)",
            }}
          >

            {/* HEADER */}

            <div
              style={{
                padding:
                  "15px 16px",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                borderBottom:
                  isLight
                    ? "1px solid #e7efec"
                    : "1px solid rgba(142,182,155,.10)",
              }}
            >
              <div>
                <strong
                  style={{
                    display:
                      "block",
                    color:
                      isLight
                        ? "#163832"
                        : "#DAF1DE",
                    fontSize: "12px",
                  }}
                >
                  Notifications
                </strong>

                <span
                  style={{
                    display:
                      "block",
                    marginTop: "3px",
                    color:
                      isLight
                        ? "#729087"
                        : "#759A91",
                    fontSize: "9px",
                  }}
                >
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "All caught up"}
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "5px",
                }}
              >
                {unreadCount >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      markAllAsRead
                    }
                    style={{
                      border:
                        "none",
                      background:
                        "transparent",
                      color:
                        "#8EB69B",
                      fontSize:
                        "9px",
                      fontWeight:
                        700,
                      cursor:
                        "pointer",
                    }}
                  >
                    Mark all read
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setNotificationOpen(
                      false
                    )
                  }
                  style={{
                    border:
                      "none",
                    background:
                      "transparent",
                    color:
                      isLight
                        ? "#729087"
                        : "#759A91",
                    cursor:
                      "pointer",
                    display:
                      "grid",
                    placeItems:
                      "center",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* BODY */}

            <div
              style={{
                maxHeight:
                  "420px",
                overflowY:
                  "auto",
              }}
            >
              {notificationLoading ? (
                <div
                  style={{
                    padding:
                      "35px 18px",
                    textAlign:
                      "center",
                    color:
                      isLight
                        ? "#729087"
                        : "#759A91",
                    fontSize:
                      "10px",
                  }}
                >
                  Loading notifications...
                </div>
              ) : notifications.length ===
                0 ? (
                <div
                  style={{
                    padding:
                      "40px 18px",
                    textAlign:
                      "center",
                  }}
                >
                  <div
                    style={{
                      width:
                        "42px",
                      height:
                        "42px",
                      margin:
                        "0 auto 11px",
                      borderRadius:
                        "12px",
                      display:
                        "grid",
                      placeItems:
                        "center",
                      background:
                        isLight
                          ? "#eef7f3"
                          : "rgba(142,182,155,.09)",
                      color:
                        "#8EB69B",
                    }}
                  >
                    <Bell
                      size={18}
                    />
                  </div>

                  <strong
                    style={{
                      display:
                        "block",
                      color:
                        isLight
                          ? "#163832"
                          : "#DAF1DE",
                      fontSize:
                        "11px",
                    }}
                  >
                    No notifications
                  </strong>

                  <span
                    style={{
                      display:
                        "block",
                      marginTop:
                        "5px",
                      color:
                        isLight
                          ? "#729087"
                          : "#759A91",
                      fontSize:
                        "9px",
                    }}
                  >
                    New interview and hiring
                    activity will appear here.
                  </span>
                </div>
              ) : (
                notifications.map(
                  (notification) => (
                    <div
                      key={
                        notification.id
                      }
                      style={{
                        display:
                          "flex",
                        gap: "10px",
                        padding:
                          "12px 14px",
                        borderBottom:
                          isLight
                            ? "1px solid #eef3f1"
                            : "1px solid rgba(142,182,155,.07)",
                        background:
                          notification.read
                            ? "transparent"
                            : isLight
                            ? "rgba(142,182,155,.08)"
                            : "rgba(142,182,155,.055)",
                      }}
                    >

                      <div
                        style={{
                          flex:
                            "0 0 30px",
                          width:
                            "30px",
                          height:
                            "30px",
                          borderRadius:
                            "9px",
                          display:
                            "grid",
                          placeItems:
                            "center",
                          background:
                            "rgba(142,182,155,.10)",
                          color:
                            "#8EB69B",
                        }}
                      >
                        {getNotificationIcon(
                          notification.type
                        )}
                      </div>

                      <div
                        style={{
                          minWidth:
                            0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "flex-start",
                            justifyContent:
                              "space-between",
                            gap: "8px",
                          }}
                        >
                          <strong
                            style={{
                              color:
                                isLight
                                  ? "#163832"
                                  : "#DAF1DE",
                              fontSize:
                                "10px",
                              lineHeight:
                                1.35,
                            }}
                          >
                            {
                              notification.title
                            }
                          </strong>

                          {!notification.read && (
                            <span
                              style={{
                                width:
                                  "5px",
                                height:
                                  "5px",
                                flex:
                                  "0 0 5px",
                                marginTop:
                                  "4px",
                                borderRadius:
                                  "50%",
                                background:
                                  "#8EB69B",
                              }}
                            />
                          )}
                        </div>

                        <p
                          style={{
                            margin:
                              "4px 0 6px",
                            color:
                              isLight
                                ? "#729087"
                                : "#8eaea6",
                            fontSize:
                              "9px",
                            lineHeight:
                              1.45,
                          }}
                        >
                          {
                            notification.message
                          }
                        </p>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                          }}
                        >
                          <span
                            style={{
                              color:
                                isLight
                                  ? "#9aaea8"
                                  : "#63877d",
                              fontSize:
                                "8px",
                            }}
                          >
                            {formatNotificationTime(
                              notification.createdAt
                            )}
                          </span>

                          <div
                            style={{
                              display:
                                "flex",
                              gap: "4px",
                            }}
                          >
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={() =>
                                  markAsRead(
                                    notification.id
                                  )
                                }
                                title="Mark as read"
                                style={{
                                  width:
                                    "23px",
                                  height:
                                    "23px",
                                  padding:
                                    0,
                                  border:
                                    "1px solid rgba(142,182,155,.16)",
                                  borderRadius:
                                    "7px",
                                  background:
                                    "transparent",
                                  color:
                                    "#8EB69B",
                                  display:
                                    "grid",
                                  placeItems:
                                    "center",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                <Check
                                  size={
                                    11
                                  }
                                />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                deleteNotification(
                                  notification.id
                                )
                              }
                              title="Delete"
                              style={{
                                width:
                                  "23px",
                                height:
                                  "23px",
                                padding:
                                  0,
                                border:
                                  "1px solid rgba(142,182,155,.12)",
                                borderRadius:
                                  "7px",
                                background:
                                  "transparent",
                                color:
                                  isLight
                                    ? "#78938b"
                                    : "#6f9288",
                                display:
                                  "grid",
                                placeItems:
                                  "center",
                                cursor:
                                  "pointer",
                              }}
                            >
                              <Trash2
                                size={
                                  11
                                }
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )
              )}
            </div>

          </div>,
          document.body
        )
      : null;

  /* =======================================================
     NEW MENU PORTAL
  ======================================================= */

  const newMenuPortal =
    newMenuOpen &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            id="hireiq-new-menu"
            style={{
              position: "fixed",
              top: "72px",
              right: "125px",
              width: "220px",
              zIndex: 999998,
              padding: "7px",
              borderRadius: "13px",
              background:
                isLight
                  ? "#ffffff"
                  : "#0B2B26",
              border: isLight
                ? "1px solid #dcebe6"
                : "1px solid rgba(142,182,155,.20)",
              boxShadow:
                "0 22px 50px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                padding:
                  "8px 10px 7px",
                color:
                  isLight
                    ? "#729087"
                    : "#759A91",
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing:
                  ".12em",
              }}
            >
              CREATE NEW
            </div>

            <button
              type="button"
              onClick={() =>
                handleNewAction(
                  "/jobs"
                )
              }
              style={menuButtonStyle(
                isLight
              )}
            >
              <span
                style={menuIconStyle()}
              >
                <BriefcaseBusiness
                  size={14}
                />
              </span>

              <span>
                <strong>
                  New Job
                </strong>

                <small>
                  Create a job opening
                </small>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleNewAction(
                  "/candidates"
                )
              }
              style={menuButtonStyle(
                isLight
              )}
            >
              <span
                style={menuIconStyle()}
              >
                <UserPlus
                  size={14}
                />
              </span>

              <span>
                <strong>
                  Add Candidate
                </strong>

                <small>
                  Add a new applicant
                </small>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleNewAction(
                  "/interviews"
                )
              }
              style={menuButtonStyle(
                isLight
              )}
            >
              <span
                style={menuIconStyle()}
              >
                <CalendarDays
                  size={14}
                />
              </span>

              <span>
                <strong>
                  Schedule Interview
                </strong>

                <small>
                  Schedule candidate meeting
                </small>
              </span>
            </button>
          </div>,
          document.body
        )
      : null;

  /* =======================================================
     USER MENU PORTAL
  ======================================================= */

  const userMenuPortal =
    userMenuOpen &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            id="hireiq-user-menu"
            style={{
              position: "fixed",
              top: "72px",
              right: "26px",
              width: "205px",
              zIndex: 999998,
              padding: "7px",
              borderRadius: "13px",
              background:
                isLight
                  ? "#ffffff"
                  : "#0B2B26",
              border: isLight
                ? "1px solid #dcebe6"
                : "1px solid rgba(142,182,155,.20)",
              boxShadow:
                "0 22px 50px rgba(0,0,0,.35)",
            }}
          >

            <div
              style={{
                padding:
                  "9px 10px",
                borderBottom:
                  isLight
                    ? "1px solid #edf2f0"
                    : "1px solid rgba(142,182,155,.08)",
                marginBottom:
                  "5px",
              }}
            >
              <strong
                style={{
                  display:
                    "block",
                  color:
                    isLight
                      ? "#163832"
                      : "#DAF1DE",
                  fontSize:
                    "10px",
                }}
              >
                Alex Morgan
              </strong>

              <span
                style={{
                  display:
                    "block",
                  marginTop:
                    "3px",
                  color:
                    isLight
                      ? "#729087"
                      : "#759A91",
                  fontSize:
                    "8px",
                }}
              >
                Recruiter
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(
                  false
                );

                navigate(
                  "/settings"
                );
              }}
              style={menuButtonStyle(
                isLight
              )}
            >
              <span
                style={menuIconStyle()}
              >
                <Settings
                  size={14}
                />
              </span>

              <span>
                <strong>
                  Settings
                </strong>

                <small>
                  Manage your account
                </small>
              </span>
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              style={{
                ...menuButtonStyle(
                  isLight
                ),
                color:
                  isLight
                    ? "#a34e4e"
                    : "#d99a9a",
              }}
            >
              <span
                style={{
                  ...menuIconStyle(),
                  color:
                    isLight
                      ? "#a34e4e"
                      : "#d99a9a",
                  background:
                    isLight
                      ? "rgba(163,78,78,.08)"
                      : "rgba(217,154,154,.08)",
                }}
              >
                <LogOut
                  size={14}
                />
              </span>

              <span>
                <strong>
                  Logout
                </strong>

                <small>
                  Sign out of HireIQ
                </small>
              </span>
            </button>

          </div>,
          document.body
        )
      : null;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <header className="topbar">

        {/* =================================================
            SEARCH
        ================================================= */}

        <form
          className="search-box"
          onSubmit={
            handleSearchSubmit
          }
        >
          <Search size={17} />

          <input
            type="text"
            placeholder="Search candidates, jobs..."
            value={searchValue}
            onChange={(event) =>
              setSearchValue(
                event.target.value
              )
            }
          />

          <div className="search-shortcut">
            <Command size={12} />
            <span>K</span>
          </div>
        </form>

        {/* =================================================
            RIGHT ACTIONS
        ================================================= */}

        <div className="topbar-actions">

          {/* THEME */}

          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={
              toggleTheme
            }
            title={
              isLight
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
          >
            {isLight ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {/* BELL */}

          <button
            ref={
              notificationButtonRef
            }
            type="button"
            className="icon-button notification-button"
            onClick={
              handleBellClick
            }
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />

            {unreadCount >
              0 && (
              <span className="notification-dot"></span>
            )}

            {unreadCount >
              0 && (
              <span
                style={{
                  position:
                    "absolute",
                  top: "-5px",
                  right: "-5px",
                  minWidth:
                    "16px",
                  height:
                    "16px",
                  padding:
                    "0 4px",
                  borderRadius:
                    "999px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#8EB69B",
                  color:
                    "#051F20",
                  fontSize:
                    "8px",
                  fontWeight: 800,
                  lineHeight:
                    1,
                  border:
                    "2px solid #051F20",
                  pointerEvents:
                    "none",
                }}
              >
                {unreadCount >
                9
                  ? "9+"
                  : unreadCount}
              </span>
            )}
          </button>

          <div className="topbar-divider"></div>

          {/* NEW */}

          <button
            ref={
              newButtonRef
            }
            type="button"
            className="create-button"
            onClick={
              openNewMenu
            }
          >
            <Plus size={16} />

            <span>
              New
            </span>
          </button>

          {/* USER */}

          <div
            ref={
              userButtonRef
            }
            className="topbar-user"
            onClick={
              openUserMenu
            }
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.key ===
                  "Enter" ||
                event.key ===
                  " "
              ) {
                event.preventDefault();

                openUserMenu();
              }
            }}
            style={{
              cursor: "pointer",
            }}
          >
            <div className="topbar-avatar">
              AM
            </div>

            <div className="topbar-user-info">
              <strong>
                Alex Morgan
              </strong>

              <span>
                Recruiter
              </span>
            </div>
          </div>

        </div>
      </header>

      {notificationPortal}

      {newMenuPortal}

      {userMenuPortal}
    </>
  );
}

/* =========================================================
   MENU STYLES
========================================================= */

const menuButtonStyle = (
  isLight
) => ({
  width: "100%",
  border: "none",
  background:
    "transparent",
  color:
    isLight
      ? "#163832"
      : "#DAF1DE",
  display: "flex",
  alignItems:
    "center",
  gap: "9px",
  padding:
    "9px 8px",
  borderRadius:
    "9px",
  cursor:
    "pointer",
  textAlign:
    "left",
});

const menuIconStyle = () => ({
  width: "29px",
  height: "29px",
  flex:
    "0 0 29px",
  borderRadius:
    "8px",
  display: "grid",
  placeItems:
    "center",
  color:
    "#8EB69B",
  background:
    "rgba(142,182,155,.09)",
});

/* =========================================================
   EXPORT
========================================================= */

export default Topbar;
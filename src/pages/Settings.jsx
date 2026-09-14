import { useEffect, useRef, useState } from "react";

import {
  User,
  Bell,
  ShieldCheck,
  BrainCircuit,
  Building2,
  Save,
  CheckCircle2,
  Mail,
  Smartphone,
  LockKeyhole,
  Eye,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import "./Settings.css";

/* =========================================================
   STORAGE
========================================================= */

const SETTINGS_KEY = "hireiq_settings";
const PROFILE_EVENT = "hireiq-profile-updated";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
  fullName: "Alex Morgan",
  email: "alex.morgan@hireiq.com",
  company: "HireIQ Technologies",
  role: "Head of Talent",
  photo: "",

  emailNotifications: true,
  interviewReminders: true,
  aiRecommendations: true,
  weeklyReports: true,
  candidateAlerts: true,

  aiScreening: true,
  smartRanking: true,
  biasDetection: true,
};

/* =========================================================
   LOAD SETTINGS
========================================================= */

const loadSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

    if (!saved) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

/* =========================================================
   PROFILE EVENT
========================================================= */

const dispatchProfileUpdate = (profile) => {
  window.dispatchEvent(
    new CustomEvent(PROFILE_EVENT, {
      detail: {
        name: profile.fullName || "Alex Morgan",
        email:
          profile.email ||
          "alex.morgan@hireiq.com",
        role:
          profile.role ||
          "Recruiter",
        photo: profile.photo || "",
      },
    })
  );
};

/* =========================================================
   SETTINGS
========================================================= */

function Settings() {
  const [activeTab, setActiveTab] =
    useState("Profile");

  const [saved, setSaved] =
    useState(false);

  const [settings, setSettings] =
    useState(loadSettings);

  const [securityMessage, setSecurityMessage] =
    useState("");

  /* =======================================================
     PASSWORD MODAL
  ======================================================= */

  const [passwordModalOpen, setPasswordModalOpen] =
    useState(false);

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  /* =======================================================
     SESSION MODAL
  ======================================================= */

  const [sessionsModalOpen, setSessionsModalOpen] =
    useState(false);

  /* =======================================================
     PHOTO
  ======================================================= */

  const photoInputRef =
    useRef(null);

  /* =======================================================
     PERSIST LOADED SETTINGS
  ======================================================= */

  useEffect(() => {
    const handleStorage = (event) => {
      if (
        event.key ===
        SETTINGS_KEY
      ) {
        setSettings(
          loadSettings()
        );
      }
    };

    const handleProfileUpdate = () => {
      setSettings(
        loadSettings()
      );
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      PROFILE_EVENT,
      handleProfileUpdate
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        PROFILE_EVENT,
        handleProfileUpdate
      );
    };
  }, []);

  /* =======================================================
     UPDATE
  ======================================================= */

  const updateSetting = (
    key,
    value
  ) => {
    setSettings(
      (prev) => ({
        ...prev,
        [key]: value,
      })
    );

    setSaved(false);
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = () => {
    try {
      const nextSettings = {
        ...settings,
      };

      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(
          nextSettings
        )
      );

      /*
        Keep local HireIQ user object
        synchronized.
      */

      const storedUser =
        localStorage.getItem(
          "hireiq_user"
        );

      if (storedUser) {
        try {
          const user =
            JSON.parse(
              storedUser
            );

          localStorage.setItem(
            "hireiq_user",
            JSON.stringify({
              ...user,
              name:
                nextSettings.fullName,
              email:
                nextSettings.email,
              role:
                nextSettings.role,
              photo:
                nextSettings.photo ||
                "",
            })
          );
        } catch {
          // Ignore malformed user storage.
        }
      } else {
        localStorage.setItem(
          "hireiq_user",
          JSON.stringify({
            name:
              nextSettings.fullName,
            email:
              nextSettings.email,
            role:
              nextSettings.role,
            photo:
              nextSettings.photo ||
              "",
          })
        );
      }

      /*
        Tell Topbar + Sidebar immediately.
      */

      dispatchProfileUpdate(
        nextSettings
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      console.error(
        "Settings save error:",
        error
      );
    }
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset = () => {
    const confirmed =
      window.confirm(
        "Reset all HireIQ settings to their default values?"
      );

    if (!confirmed) {
      return;
    }

    setSettings(
      DEFAULT_SETTINGS
    );

    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(
        DEFAULT_SETTINGS
      )
    );

    localStorage.setItem(
      "hireiq_user",
      JSON.stringify({
        name:
          DEFAULT_SETTINGS.fullName,
        email:
          DEFAULT_SETTINGS.email,
        role:
          DEFAULT_SETTINGS.role,
        photo:
          "",
      })
    );

    dispatchProfileUpdate(
      DEFAULT_SETTINGS
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  /* =======================================================
     SECURITY MESSAGE
  ======================================================= */

  const showSecurityMessage =
    (message) => {
      setSecurityMessage(
        message
      );

      setTimeout(() => {
        setSecurityMessage("");
      }, 3000);
    };

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  const handleChangePassword = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setPasswordError("");
    setPasswordSuccess("");
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = (
    event
  ) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill all password fields."
      );
      return;
    }

    if (
      newPassword.length < 8
    ) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordError(
        "New passwords do not match."
      );
      return;
    }

    /*
      Existing project login uses:
      alex@hireiq.com / 12345678

      We preserve the current demo
      password through localStorage.
    */

    const savedPassword =
      localStorage.getItem(
        "hireiq_demo_password"
      ) || "12345678";

    if (
      currentPassword !==
      savedPassword
    ) {
      setPasswordError(
        "Current password is incorrect."
      );
      return;
    }

    localStorage.setItem(
      "hireiq_demo_password",
      newPassword
    );

    setPasswordSuccess(
      "Password changed successfully."
    );

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setTimeout(() => {
      setPasswordModalOpen(
        false
      );

      setPasswordSuccess("");
    }, 1500);
  };

  /* =======================================================
     MANAGE SESSIONS
  ======================================================= */

  const handleManageSessions = () => {
    setSessionsModalOpen(true);
  };

  const handleSignOutOtherSessions = () => {
    /*
      In the current local-dev build there is
      only one browser session represented
      by the active token, so there are no
      other stored sessions to revoke.
    */

    showSecurityMessage(
      "No other active sessions were found."
    );
  };

  /* =======================================================
     CHANGE PHOTO
  ======================================================= */

  const handlePhotoChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      showSecurityMessage(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      showSecurityMessage(
        "Profile photo must be smaller than 2MB."
      );

      event.target.value = "";
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const photo =
        reader.result;

      const nextSettings = {
        ...settings,
        photo,
      };

      setSettings(
        nextSettings
      );

      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(
          nextSettings
        )
      );

      const storedUser =
        localStorage.getItem(
          "hireiq_user"
        );

      if (storedUser) {
        try {
          const user =
            JSON.parse(
              storedUser
            );

          localStorage.setItem(
            "hireiq_user",
            JSON.stringify({
              ...user,
              name:
                nextSettings.fullName,
              email:
                nextSettings.email,
              role:
                nextSettings.role,
              photo,
            })
          );
        } catch {
          // Ignore malformed user storage.
        }
      } else {
        localStorage.setItem(
          "hireiq_user",
          JSON.stringify({
            name:
              nextSettings.fullName,
            email:
              nextSettings.email,
            role:
              nextSettings.role,
            photo,
          })
        );
      }

      dispatchProfileUpdate(
        nextSettings
      );

      showSecurityMessage(
        "Profile photo updated successfully."
      );

      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  /* =======================================================
     TABS
  ======================================================= */

  const tabs = [
    {
      label: "Profile",
      icon: User,
    },
    {
      label: "Notifications",
      icon: Bell,
    },
    {
      label: "AI & Automation",
      icon: BrainCircuit,
    },
    {
      label: "Security",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="settings-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="settings-header">

        <div>

          <div className="settings-eyebrow">
            <span></span>
            SYSTEM CONFIGURATION
          </div>

          <h1>
            Settings
          </h1>

          <p>
            Manage your HireIQ workspace,
            preferences and AI recruitment
            intelligence.
          </p>

        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >

          <button
            type="button"
            onClick={
              handleReset
            }
            style={{
              padding:
                "9px 13px",
              border:
                "1px solid rgba(118,205,176,.13)",
              borderRadius:
                "7px",
              background:
                "transparent",
              color:
                "#759990",
              fontSize:
                "9px",
              cursor:
                "pointer",
            }}
          >
            Reset
          </button>

          <button
            type="button"
            className="settings-save-btn"
            onClick={
              handleSave
            }
          >
            {saved ? (
              <>
                <CheckCircle2
                  size={15}
                />

                Saved
              </>
            ) : (
              <>
                <Save
                  size={15}
                />

                Save Changes
              </>
            )}
          </button>

        </div>

      </div>

      {/* =================================================
          LAYOUT
      ================================================= */}

      <div className="settings-layout">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="settings-sidebar">

          <div className="settings-sidebar-title">
            Settings
          </div>

          <div className="settings-tabs">

            {tabs.map(
              (tab) => {
                const Icon =
                  tab.icon;

                return (
                  <button
                    type="button"
                    key={
                      tab.label
                    }
                    className={
                      activeTab ===
                      tab.label
                        ? "settings-tab active"
                        : "settings-tab"
                    }
                    onClick={() =>
                      setActiveTab(
                        tab.label
                      )
                    }
                  >
                    <Icon
                      size={16}
                    />

                    <span>
                      {
                        tab.label
                      }
                    </span>

                    <ChevronRight
                      size={13}
                    />
                  </button>
                );
              }
            )}

          </div>

          {/* WORKSPACE */}

          <div className="workspace-card">

            <div className="workspace-icon">
              <Building2
                size={17}
              />
            </div>

            <div>

              <strong>
                HireIQ Workspace
              </strong>

              <span>
                Enterprise plan
              </span>

            </div>

          </div>

        </aside>

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="settings-content">

          {/* =================================================
              PROFILE
          ================================================= */}

          {activeTab ===
            "Profile" && (
            <section className="settings-panel">

              <div className="settings-panel-header">

                <div>

                  <h2>
                    Profile Information
                  </h2>

                  <p>
                    Update your personal
                    and workspace information.
                  </p>

                </div>

                <div className="panel-icon">
                  <User
                    size={17}
                  />
                </div>

              </div>

              <div className="profile-preview">

                <div
                  className="profile-avatar"
                  style={
                    settings.photo
                      ? {
                          backgroundImage: `url(${settings.photo})`,
                          backgroundSize:
                            "cover",
                          backgroundPosition:
                            "center",
                        }
                      : undefined
                  }
                >
                  {!settings.photo &&
                    settings.fullName
                      .split(" ")
                      .map(
                        (part) =>
                          part[0]
                      )
                      .join("")
                      .slice(
                        0,
                        2
                      )
                      .toUpperCase()}
                </div>

                <div>

                  <strong>
                    {
                      settings.fullName
                    }
                  </strong>

                  <span>
                    {
                      settings.role
                    }
                  </span>

                </div>

                <input
                  ref={
                    photoInputRef
                  }
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{
                    display: "none",
                  }}
                  onChange={
                    handlePhotoChange
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    photoInputRef.current?.click()
                  }
                >
                  Change photo
                </button>

              </div>

              <div className="settings-form-grid">

                <div className="settings-field">

                  <label>
                    Full Name
                  </label>

                  <input
                    value={
                      settings.fullName
                    }
                    onChange={(
                      event
                    ) =>
                      updateSetting(
                        "fullName",
                        event.target
                          .value
                      )
                    }
                  />

                </div>

                <div className="settings-field">

                  <label>
                    Work Email
                  </label>

                  <div className="input-with-icon">

                    <Mail
                      size={14}
                    />

                    <input
                      value={
                        settings.email
                      }
                      onChange={(
                        event
                      ) =>
                        updateSetting(
                          "email",
                          event.target
                            .value
                        )
                      }
                    />

                  </div>

                </div>

                <div className="settings-field">

                  <label>
                    Company
                  </label>

                  <div className="input-with-icon">

                    <Building2
                      size={14}
                    />

                    <input
                      value={
                        settings.company
                      }
                      onChange={(
                        event
                      ) =>
                        updateSetting(
                          "company",
                          event.target
                            .value
                        )
                      }
                    />

                  </div>

                </div>

                <div className="settings-field">

                  <label>
                    Role
                  </label>

                  <input
                    value={
                      settings.role
                    }
                    onChange={(
                      event
                    ) =>
                      updateSetting(
                        "role",
                        event.target
                          .value
                      )
                    }
                  />

                </div>

              </div>

              <div className="settings-info-card">

                <div className="settings-info-icon">
                  <Sparkles
                    size={16}
                  />
                </div>

                <div>

                  <strong>
                    Your profile powers AI recommendations
                  </strong>

                  <p>
                    HireIQ uses your role
                    and workspace preferences
                    to personalize recruitment
                    insights and recommendations.
                  </p>

                </div>

              </div>

            </section>
          )}

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          {activeTab ===
            "Notifications" && (
            <section className="settings-panel">

              <div className="settings-panel-header">

                <div>

                  <h2>
                    Notifications
                  </h2>

                  <p>
                    Control when HireIQ sends
                    you hiring updates and alerts.
                  </p>

                </div>

                <div className="panel-icon">
                  <Bell
                    size={17}
                  />
                </div>

              </div>

              <div className="settings-options">

                <SettingToggle
                  icon={
                    <Mail
                      size={16}
                    />
                  }
                  title="Email Notifications"
                  description="Receive important hiring updates by email."
                  enabled={
                    settings.emailNotifications
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "emailNotifications",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={
                    <CalendarIcon />
                  }
                  title="Interview Reminders"
                  description="Get notified before upcoming interviews."
                  enabled={
                    settings.interviewReminders
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "interviewReminders",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={
                    <Sparkles
                      size={16}
                    />
                  }
                  title="AI Recommendations"
                  description="Receive AI-generated candidate recommendations."
                  enabled={
                    settings.aiRecommendations
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "aiRecommendations",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={
                    <Bell
                      size={16}
                    />
                  }
                  title="Candidate Alerts"
                  description="Get notified about important candidate activity."
                  enabled={
                    settings.candidateAlerts
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "candidateAlerts",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={
                    <Eye
                      size={16}
                    />
                  }
                  title="Weekly Hiring Reports"
                  description="Receive a weekly recruitment performance summary."
                  enabled={
                    settings.weeklyReports
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "weeklyReports",
                      value
                    )
                  }
                />

              </div>

            </section>
          )}

          {/* =================================================
              AI
          ================================================= */}

          {activeTab ===
            "AI & Automation" && (
            <section className="settings-panel">

              <div className="settings-panel-header">

                <div>

                  <h2>
                    AI & Automation
                  </h2>

                  <p>
                    Configure how HireIQ AI
                    assists your recruitment workflow.
                  </p>

                </div>

                <div className="panel-icon ai-panel-icon">
                  <BrainCircuit
                    size={17}
                  />
                </div>

              </div>

              <div className="ai-settings-banner">

                <div className="ai-settings-banner-icon">
                  <Sparkles
                    size={18}
                  />
                </div>

                <div>

                  <strong>
                    HireIQ AI is actively optimizing your hiring
                  </strong>

                  <p>
                    AI continuously analyzes
                    candidate signals, job requirements
                    and recruitment patterns.
                  </p>

                </div>

                <span>
                  ACTIVE
                </span>

              </div>

              <div className="settings-options">

                <SettingToggle
                  icon={
                    <BrainCircuit
                      size={16}
                    />
                  }
                  title="AI Screening"
                  description="Automatically evaluate candidates against job requirements."
                  enabled={
                    settings.aiScreening
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "aiScreening",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={
                    <Sparkles
                      size={16}
                    />
                  }
                  title="Smart Candidate Ranking"
                  description="Rank candidates using AI match scores and recruitment signals."
                  enabled={
                    settings.smartRanking
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "smartRanking",
                      value
                    )
                  }
                />

                <SettingToggle
                  icon={
                    <ShieldCheck
                      size={16}
                    />
                  }
                  title="Bias Detection"
                  description="Detect potentially biased patterns during candidate evaluation."
                  enabled={
                    settings.biasDetection
                  }
                  onChange={(
                    value
                  ) =>
                    updateSetting(
                      "biasDetection",
                      value
                    )
                  }
                />

              </div>

              <div className="ai-performance-card">

                <div>

                  <span>
                    AI Match Accuracy
                  </span>

                  <strong>
                    94.6%
                  </strong>

                </div>

                <div className="ai-performance-track">
                  <div></div>
                </div>

                <p>
                  AI confidence remains high
                  across your current candidate pool.
                </p>

              </div>

            </section>
          )}

          {/* =================================================
              SECURITY
          ================================================= */}

          {activeTab ===
            "Security" && (
            <section className="settings-panel">

              <div className="settings-panel-header">

                <div>

                  <h2>
                    Security
                  </h2>

                  <p>
                    Manage account access
                    and security preferences.
                  </p>

                </div>

                <div className="panel-icon">
                  <ShieldCheck
                    size={17}
                  />
                </div>

              </div>

              <div className="security-status">

                <div className="security-status-icon">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <div>

                  <strong>
                    Your account is secure
                  </strong>

                  <span>
                    No security issues detected.
                  </span>

                </div>

                <span className="security-active">
                  PROTECTED
                </span>

              </div>

              {securityMessage && (
                <div
                  style={{
                    marginTop:
                      "12px",
                    padding:
                      "9px 11px",
                    borderRadius:
                      "8px",
                    border:
                      "1px solid rgba(118,205,176,.15)",
                    background:
                      "rgba(118,205,176,.05)",
                    color:
                      "#92c5b4",
                    fontSize:
                      "9px",
                  }}
                >
                  {securityMessage}
                </div>
              )}

              <div className="security-items">

                <div className="security-item">

                  <div className="security-item-icon">
                    <LockKeyhole
                      size={16}
                    />
                  </div>

                  <div>

                    <strong>
                      Password
                    </strong>

                    <span>
                      Managed through your
                      HireIQ authentication account
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleChangePassword
                    }
                  >
                    Change

                    <ChevronRight
                      size={13}
                    />
                  </button>

                </div>

                <div className="security-item">

                  <div className="security-item-icon">
                    <Smartphone
                      size={16}
                    />
                  </div>

                  <div>

                    <strong>
                      Two-factor authentication
                    </strong>

                    <span>
                      Additional account protection
                    </span>

                  </div>

                  <span className="enabled-badge">
                    Enabled
                  </span>

                </div>

                <div className="security-item">

                  <div className="security-item-icon">
                    <Eye
                      size={16}
                    />
                  </div>

                  <div>

                    <strong>
                      Active sessions
                    </strong>

                    <span>
                      Current browser session
                      is active
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={
                      handleManageSessions
                    }
                  >
                    Manage

                    <ChevronRight
                      size={13}
                    />
                  </button>

                </div>

              </div>

            </section>
          )}

        </main>

      </div>

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      {passwordModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "grid",
            placeItems: "center",
            background:
              "rgba(0,0,0,.58)",
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPasswordModalOpen(
                false
              );
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "430px",
              background: "#0B2B26",
              border:
                "1px solid rgba(142,182,155,.18)",
              borderRadius: "16px",
              padding: "22px",
              boxShadow:
                "0 25px 70px rgba(0,0,0,.45)",
            }}
          >
            <h3
              style={{
                color: "#DAF1DE",
                fontSize: "16px",
                marginBottom: "6px",
              }}
            >
              Change Password
            </h3>

            <p
              style={{
                color: "#759A91",
                fontSize: "10px",
                marginBottom: "18px",
              }}
            >
              Update your HireIQ account password.
            </p>

            <form
              onSubmit={
                handlePasswordSubmit
              }
            >

              {[
                [
                  "Current Password",
                  "currentPassword",
                ],
                [
                  "New Password",
                  "newPassword",
                ],
                [
                  "Confirm Password",
                  "confirmPassword",
                ],
              ].map(
                ([label, key]) => (
                  <div
                    key={key}
                    style={{
                      marginBottom:
                        "12px",
                    }}
                  >
                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "6px",
                        color:
                          "#8EB69B",
                        fontSize:
                          "9px",
                      }}
                    >
                      {label}
                    </label>

                    <input
                      type="password"
                      value={
                        passwordForm[
                          key
                        ]
                      }
                      onChange={(
                        event
                      ) =>
                        setPasswordForm(
                          (prev) => ({
                            ...prev,
                            [key]:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      style={{
                        width:
                          "100%",
                        padding:
                          "11px 12px",
                        borderRadius:
                          "8px",
                        border:
                          "1px solid rgba(142,182,155,.16)",
                        background:
                          "#163832",
                        color:
                          "#DAF1DE",
                        outline:
                          "none",
                      }}
                    />
                  </div>
                )
              )}

              {passwordError && (
                <div
                  style={{
                    marginBottom:
                      "10px",
                    color:
                      "#e59a9a",
                    fontSize:
                      "9px",
                  }}
                >
                  {
                    passwordError
                  }
                </div>
              )}

              {passwordSuccess && (
                <div
                  style={{
                    marginBottom:
                      "10px",
                    color:
                      "#8EB69B",
                    fontSize:
                      "9px",
                  }}
                >
                  {
                    passwordSuccess
                  }
                </div>
              )}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap: "8px",
                  marginTop:
                    "16px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setPasswordModalOpen(
                      false
                    )
                  }
                  style={{
                    padding:
                      "9px 13px",
                    border:
                      "1px solid rgba(142,182,155,.14)",
                    borderRadius:
                      "8px",
                    background:
                      "transparent",
                    color:
                      "#8EB69B",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding:
                      "9px 14px",
                    border: "none",
                    borderRadius:
                      "8px",
                    background:
                      "#8EB69B",
                    color:
                      "#051F20",
                    fontWeight:
                      700,
                  }}
                >
                  Update Password
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ACTIVE SESSIONS MODAL
      ===================================================== */}

      {sessionsModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "grid",
            placeItems: "center",
            background:
              "rgba(0,0,0,.58)",
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSessionsModalOpen(
                false
              );
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "470px",
              background: "#0B2B26",
              border:
                "1px solid rgba(142,182,155,.18)",
              borderRadius: "16px",
              padding: "22px",
              boxShadow:
                "0 25px 70px rgba(0,0,0,.45)",
            }}
          >
            <h3
              style={{
                color: "#DAF1DE",
                fontSize: "16px",
                marginBottom: "6px",
              }}
            >
              Active Sessions
            </h3>

            <p
              style={{
                color: "#759A91",
                fontSize: "10px",
                marginBottom: "18px",
              }}
            >
              Manage devices currently using this HireIQ account.
            </p>

            <div
              style={{
                padding: "13px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(142,182,155,.12)",
                background: "#163832",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >
              <div>

                <strong
                  style={{
                    display:
                      "block",
                    color:
                      "#DAF1DE",
                    fontSize:
                      "10px",
                  }}
                >
                  Current Browser
                </strong>

                <span
                  style={{
                    display:
                      "block",
                    marginTop:
                      "4px",
                    color:
                      "#759A91",
                    fontSize:
                      "8px",
                  }}
                >
                  This device • Active now
                </span>

              </div>

              <span
                style={{
                  padding:
                    "5px 8px",
                  borderRadius:
                    "999px",
                  background:
                    "rgba(142,182,155,.10)",
                  color:
                    "#8EB69B",
                  fontSize:
                    "8px",
                  fontWeight:
                    700,
                }}
              >
                CURRENT
              </span>

            </div>

            <button
              type="button"
              onClick={
                handleSignOutOtherSessions
              }
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "10px",
                border:
                  "1px solid rgba(217,154,154,.16)",
                borderRadius: "8px",
                background:
                  "rgba(217,154,154,.05)",
                color: "#d99a9a",
                fontSize: "9px",
                cursor: "pointer",
              }}
            >
              Sign out other sessions
            </button>

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                marginTop:
                  "18px",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setSessionsModalOpen(
                    false
                  )
                }
                style={{
                  padding:
                    "9px 14px",
                  border:
                    "1px solid rgba(142,182,155,.14)",
                  borderRadius:
                    "8px",
                  background:
                    "transparent",
                  color:
                    "#8EB69B",
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

/* =========================================================
   TOGGLE
========================================================= */

function SettingToggle({
  icon,
  title,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="setting-option">

      <div className="setting-option-icon">
        {icon}
      </div>

      <div className="setting-option-info">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <button
        type="button"
        className={
          enabled
            ? "toggle active"
            : "toggle"
        }
        onClick={() =>
          onChange(
            !enabled
          )
        }
        aria-label={`Toggle ${title}`}
      >
        <span></span>
      </button>

    </div>
  );
}

/* =========================================================
   CALENDAR ICON
========================================================= */

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        width="18"
        height="18"
        x="3"
        y="4"
        rx="2"
      />

      <line
        x1="16"
        x2="16"
        y1="2"
        y2="6"
      />

      <line
        x1="8"
        x2="8"
        y1="2"
        y2="6"
      />

      <line
        x1="3"
        x2="21"
        y1="10"
        y2="10"
      />
    </svg>
  );
}

export default Settings;
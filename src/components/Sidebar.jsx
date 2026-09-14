import {
  useEffect,
  useState,
} from "react";

import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileText,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

const PROFILE_EVENT =
  "hireiq-profile-updated";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Jobs",
    icon: BriefcaseBusiness,
    path: "/jobs",
  },
  {
    label: "Candidates",
    icon: Users,
    path: "/candidates",
  },
  {
    label: "Applications",
    icon: FileText,
    path: "/applications",
  },
  {
    label: "Interviews",
    icon: CalendarDays,
    path: "/interviews",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
];

const loadProfile = () => {
  try {
    const storedUser =
      localStorage.getItem(
        "hireiq_user"
      );

    const storedSettings =
      localStorage.getItem(
        "hireiq_settings"
      );

    const user = storedUser
      ? JSON.parse(storedUser)
      : {};

    const settings =
      storedSettings
        ? JSON.parse(
            storedSettings
          )
        : {};

    return {
      name:
        settings.fullName ||
        user.name ||
        "Alex Morgan",

      role:
        settings.role ||
        user.role ||
        "Recruiter",

      photo:
        settings.photo ||
        user.photo ||
        "",
    };
  } catch {
    return {
      name: "Alex Morgan",
      role: "Recruiter",
      photo: "",
    };
  }
};

function Sidebar() {
  const currentPath =
    window.location.pathname;

  const [profile, setProfile] =
    useState(loadProfile);

  useEffect(() => {
    const handleProfileUpdate =
      (event) => {
        const detail =
          event.detail || {};

        setProfile(
          (previous) => ({
            ...previous,

            name:
              detail.name ||
              previous.name ||
              "Alex Morgan",

            role:
              detail.role ||
              previous.role ||
              "Recruiter",

            photo:
              detail.photo ??
              previous.photo ??
              "",
          })
        );
      };

    const handleStorage = (
      event
    ) => {
      if (
        event.key ===
          "hireiq_settings" ||
        event.key ===
          "hireiq_user"
      ) {
        setProfile(
          loadProfile()
        );
      }
    };

    window.addEventListener(
      PROFILE_EVENT,
      handleProfileUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        PROFILE_EVENT,
        handleProfileUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="sidebar-logo">

        <div className="logo-mark">
          <Sparkles size={17} />
        </div>

        <div>

          <h2>HireIQ</h2>

          <span>
            AI Recruitment
          </span>

        </div>

      </div>

      {/* Main Navigation */}

      <div className="sidebar-section">

        <p className="sidebar-label">
          MAIN
        </p>

        <nav className="sidebar-nav">

          {menuItems.map(
            (item) => {
              const Icon =
                item.icon;

              const active =
                currentPath ===
                item.path;

              return (
                <a
                  key={
                    item.label
                  }
                  href={
                    item.path
                  }
                  className={`sidebar-link ${
                    active
                      ? "active"
                      : ""
                  }`}
                >
                  <Icon size={18} />

                  <span>
                    {
                      item.label
                    }
                  </span>
                </a>
              );
            }
          )}

        </nav>

      </div>

      {/* System */}

      <div className="sidebar-section">

        <p className="sidebar-label">
          SYSTEM
        </p>

        <a
          href="/settings"
          className="sidebar-link"
        >
          <Settings size={18} />

          <span>
            Settings
          </span>
        </a>

      </div>

      {/* Bottom User */}

      <div className="sidebar-user">

        <div
          className="user-avatar"
          style={
            profile.photo
              ? {
                  backgroundImage: `url(${profile.photo})`,
                  backgroundSize:
                    "cover",
                  backgroundPosition:
                    "center",
                  color:
                    "transparent",
                }
              : undefined
          }
        >
          {!profile.photo &&
            profile.name
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

        <div className="user-info">

          <strong>
            {profile.name}
          </strong>

          <span>
            {profile.role}
          </span>

        </div>

        <button className="sidebar-collapse">
          <ChevronLeft size={16} />
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;
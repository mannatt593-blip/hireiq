import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import "./App.css";

import Sidebar from "./components/sidebar";
import Topbar from "./components/topbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Candidates from "./pages/Candidate";
import Applications from "./pages/Application";
import Interviews from "./pages/Interview";
import Analytics from "./pages/Analytics";
import Settings from "./pages/settings";

import CandidateDetails from "./pages/CandidateDetails/CandidateDetails";
import CandidateProfile from "./pages/CandidateProfile/CandidateProfile";

const isAuthenticated = () => {
  return Boolean(
    localStorage.getItem("hireiq_token") ||
    localStorage.getItem("hireiqToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("hireiq_token") ||
    sessionStorage.getItem("token")
  );
};

function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

function AppLayout() {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-area">

        <Topbar />

        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================= */}

        <Route
          path="/login"
          element={
            isAuthenticated() ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <Login />
            )
          }
        />

        {/* =========================
            PROTECTED APPLICATION
        ========================= */}

        <Route element={<ProtectedRoute />}>

          <Route element={<AppLayout />}>

            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/jobs"
              element={<Jobs />}
            />

            <Route
              path="/candidates"
              element={<Candidates />}
            />

            <Route
              path="/applications"
              element={<Applications />}
            />

            <Route
              path="/applications/:candidateId"
              element={<CandidateProfile />}
            />

            <Route
              path="/application-details/:id"
              element={<CandidateDetails />}
            />

            <Route
              path="/interviews"
              element={<Interviews />}
            />

            <Route
              path="/analytics"
              element={<Analytics />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

          </Route>

        </Route>

        {/* =========================
            FALLBACK
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to={
                isAuthenticated()
                  ? "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
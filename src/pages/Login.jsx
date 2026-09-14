import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ArrowRight, Sparkles } from "lucide-react";

import "./Login.css";

const API_URL = "http://localhost:5000/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("alex@hireiq.com");
  const [password, setPassword] = useState("12345678");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(
          data.message || "Invalid email or password"
        );
      }

      localStorage.setItem("hireiq_token", data.token);

      if (data.user) {
        localStorage.setItem(
          "hireiq_user",
          JSON.stringify(data.user)
        );
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <div className="login-card">

        <div className="login-brand">
          <div className="login-brand-icon">
            <Sparkles size={20} />
          </div>

          <span>HireIQ</span>
        </div>

        <div className="login-header">
          <div className="login-eyebrow">
            AI RECRUITMENT INTELLIGENCE
          </div>

          <h1>Welcome back</h1>

          <p>
            Sign in to manage your hiring intelligence.
          </p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <div className="login-field">

            <label>Email</label>

            <div className="login-input-wrap">
              <Mail size={16} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@company.com"
                required
              />
            </div>

          </div>

          <div className="login-field">

            <label>Password</label>

            <div className="login-input-wrap">
              <LockKeyhole size={16} />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
              />
            </div>

          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}

            {!loading && (
              <ArrowRight size={16} />
            )}
          </button>

        </form>

        <div className="login-footer">
          HireIQ AI-Powered Applicant Tracking System
        </div>

      </div>

    </div>
  );
}

export default Login;
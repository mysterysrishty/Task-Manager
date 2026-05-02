import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { toast } from "sonner";
import AuthShell from "../components/auth/AuthShell";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created");
      navigate("/app");
    } catch (error) {
      const message = error.response?.data?.detail || "Registration failed";
      toast.error(typeof message === "string" ? message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Set up your workspace"
      subtitle="Create your account and start managing projects, deadlines, and progress from one clean dashboard."
      footer={
        <>
          You can also preview the app with{" "}
          <span className="font-semibold text-[var(--ink)]">
            demo@taskflow.com / demo123
          </span>
          .
          <br />
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)]"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          autoComplete="name"
          placeholder="Full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          icon={<User size={16} />}
          className="py-3.5"
        />

        <Input
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          icon={<Mail size={16} />}
          className="py-3.5"
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            icon={<Lock size={16} />}
            className="py-3.5 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-2xl py-3.5 text-sm font-semibold"
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;

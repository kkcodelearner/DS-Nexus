import { Link, useNavigate, Navigate } from "react-router-dom";
import LoginLeftSide from "./LoginLeftSide";
import Loading from "./Loading";
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext"
import toast from "react-hot-toast";

type LoginFormProps = {
  role: "admin" | "employee";
  title: string;
  subtitle: string;
};

const LoginForm = ({ role, title, subtitle }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  if (authLoading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("")
    setLoading(true);
    try {
      await login(email, password, role)
      navigate("/dashboard")
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Login failed")
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors">
            <ArrowLeftIcon size={16} /> Back to portals
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-zinc-800">{title}</h1>
            <p className="text-slate-500 text-sm sm:text-base mt-2">{subtitle}</p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              {error}
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor={`${role}-email`} className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                id={`${role}-email`}
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="john@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor={`${role}-password`} className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  id={`${role}-password`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-11 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-md text-sm font-semibold hover:from-indigo-700 hover:to-indigo-600 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center"
            >
              {loading && <Loader2Icon className="animate-spin h-4 w-4 mr-2" />}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

import { useMemo, useState } from "react";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";

// ✅ Usa tu logo real del proyecto (ajusta ruta si corresponde)
import logoImage from "../../assets/sTOCKsEGURO.png";

export default function LoginView({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) return false;

    // simple email regex (como Figma)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) return false;

    // mínimo de password para evitar submit vacío
    if (p.length < 4) return false;

    return true;
  }, [email, password]);

  // ✅ Login handler (email + password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Please enter a valid email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await window.api.login(email.trim(), password.trim());

      if (!res?.ok || !res.user) {
        setError(res?.error ?? "Invalid credentials.");
        return;
      }

      // (Opcional, lo implementamos después): persistir sesión si rememberMe
      // if (rememberMe) localStorage.setItem("ss_user", JSON.stringify(res.user));

      onLogin(res.user);
    } catch {
      setError("Internal error while signing in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full opacity-20 dark:opacity-15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-200 dark:bg-green-900 rounded-full opacity-20 dark:opacity-15 blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo and Title Section */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6 mb-4 border border-transparent dark:border-neutral-800">
            <img
              src={logoImage}
              alt="StockSeguro"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-neutral-100 mb-2">
            StockSeguro
          </h1>
          <p className="text-gray-600 dark:text-neutral-300">
            Inventory Management System
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-neutral-800">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-neutral-100 mb-1">
              Sign In
            </h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400">
              Enter your credentials to access the system
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors bg-gray-50 dark:bg-neutral-800 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900"
                  style={{ fontSize: "16px" }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none transition-colors bg-gray-50 dark:bg-neutral-800 dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:bg-white dark:focus:bg-neutral-900"
                  style={{ fontSize: "16px" }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-200 transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(ev) => setRememberMe(ev.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-neutral-300 group-hover:text-gray-800 dark:group-hover:text-neutral-100 transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                onClick={() => setError("Password recovery: pending.")}
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white font-medium py-3.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              style={{ minHeight: "52px" }}
            >
              <LogIn className="h-5 w-5" />
              <span>{loading ? "Signing In..." : "Sign In"}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400">
                or quick access
              </span>
            </div>
          </div>

          {/* Demo Access Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@stockseguro.com");
                setPassword("admin123");
                setError("");
              }}
              className="w-full bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-medium py-2.5 rounded-lg transition-colors border border-gray-200 dark:border-neutral-700 text-sm"
            >
              👤 Access as Administrator
            </button>

            <button
              type="button"
              onClick={() => {
                setEmail("cashier@stockseguro.com");
                setPassword("cashier123");
                setError("");
              }}
              className="w-full bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 font-medium py-2.5 rounded-lg transition-colors border border-gray-200 dark:border-neutral-700 text-sm"
            >
              🛒 Access as Cashier
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-neutral-400">
          <p>© 2024 StockSeguro - Inventory Management System</p>
          <p className="mt-1">Professional Liquor Store</p>
        </div>
      </div>
    </div>
  );
}

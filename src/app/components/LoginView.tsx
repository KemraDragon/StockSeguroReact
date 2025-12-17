import { useState } from "react";

type User = { id: number; rut: string; nombre: string };

export default function LoginView({ onLogin }: { onLogin: (u: User) => void }) {
  const [rut, setRut] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await window.api.login(rut.trim(), pin.trim());
      if (!res.ok || !res.user) {
        setError(res.error ?? "No se pudo iniciar sesión.");
        return;
      }
      onLogin(res.user);
    } catch {
      setError("Error interno al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 16 }}>
      <h2>StockSeguro — Login</h2>

      <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
        <label>
          RUT
          <input
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="12.345.678-9"
            autoComplete="username"
          />
        </label>

        <label>
          PIN
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            type="password"
            autoComplete="current-password"
          />
        </label>

        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

        <button disabled={loading || rut.length < 8 || pin.length < 4} type="submit">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

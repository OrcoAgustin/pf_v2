"use client";

import { login } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      return await login(formData);
    },
    undefined
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💰</div>
          <span className="auth-logo-text">FinanzApp</span>
        </div>

        {/* Header */}
        <h1 className="auth-title">Bienvenido de vuelta</h1>
        <p className="auth-subtitle">
          Iniciá sesión para acceder a tu panel de finanzas
        </p>

        {/* Success / Info message */}
        {message === "confirm-email" && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              color: "#a7f3d0",
              fontSize: "13px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "20px",
              lineHeight: "1.4",
            }}
          >
            <span style={{ fontSize: "16px", marginTop: "1px" }}>📧</span>
            <span>
              <strong>¡Registro completado!</strong> Te enviamos un correo de confirmación. Por favor, verificá tu casilla para poder continuar.
            </span>
          </div>
        )}

        {/* Error message */}
        {state?.error && (
          <div className="auth-error">
            <span>⚠️</span>
            <span>{state.error}</span>
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="auth-form">
          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              className="input"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="input"
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="spinner" />
                Ingresando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          ¿No tenés cuenta?{" "}
          <Link href="/register">Registrate gratis</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-container">
          <div
            className="auth-card"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "350px",
            }}
          >
            <div className="spinner" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

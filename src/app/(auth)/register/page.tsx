"use client";

import { register } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState } from "react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      return await register(formData);
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
        <h1 className="auth-title">Creá tu cuenta</h1>
        <p className="auth-subtitle">
          Empezá a controlar tus finanzas en minutos
        </p>

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
            <label htmlFor="displayName" className="input-label">
              Nombre
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="Tu nombre"
              className="input"
              autoComplete="name"
              autoFocus
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              className="input"
              required
              autoComplete="new-password"
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
                Creando cuenta...
              </>
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login">Iniciá sesión</Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { updatePassword } from "@/app/actions/auth";
import { useActionState } from "react";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      return await updatePassword(formData);
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
        <h1 className="auth-title">Restablecer contraseña</h1>
        <p className="auth-subtitle">
          Ingresá tu nueva contraseña para volver a acceder a tu cuenta.
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
            <label htmlFor="password" className="input-label">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              className="input"
              required
              minLength={6}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword" className="input-label">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="input"
              required
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
                Actualizando contraseña...
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

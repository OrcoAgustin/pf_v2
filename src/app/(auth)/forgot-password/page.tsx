"use client";

import { sendPasswordResetEmail } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) => {
      const res = await sendPasswordResetEmail(formData);
      if (res.success) {
        // Redirigir a login con un parámetro para mostrar el banner de correo enviado
        router.push("/login?message=reset-email-sent");
        return { success: true };
      }
      return res;
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
        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-subtitle">
          Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
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

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="spinner" />
                Enviando correo...
              </>
            ) : (
              "Enviar enlace"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer" style={{ marginTop: "24px" }}>
          <Link href="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}

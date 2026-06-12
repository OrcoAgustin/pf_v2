"use client";

import { sendPasswordResetEmail } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [cooldown, setCooldown] = useState<number>(0);

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: { error?: string; success?: boolean; rateLimit?: boolean } | undefined,
      formData: FormData
    ) => {
      const res = await sendPasswordResetEmail(formData);
      if (res.success) {
        localStorage.setItem("last_reset_email_time", Date.now().toString());
        // Redirigir a login con un parámetro para mostrar el banner de correo enviado
        router.push("/login?message=reset-email-sent");
        return { success: true };
      }
      if (res.rateLimit) {
        localStorage.setItem("last_reset_email_time", Date.now().toString());
      }
      return res;
    },
    undefined
  );

  useEffect(() => {
    const checkCooldown = () => {
      const lastSent = localStorage.getItem("last_reset_email_time");
      if (lastSent) {
        const elapsed = Date.now() - parseInt(lastSent, 10);
        const cooldownTime = 60000; // 60 segundos de cooldown
        if (elapsed < cooldownTime) {
          setCooldown(Math.ceil((cooldownTime - elapsed) / 1000));
        }
      }
    };

    checkCooldown();

    if (state?.rateLimit) {
      setCooldown(120); // 120 segundos en caso de rate limit
    }
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

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
            disabled={isPending || cooldown > 0}
          >
            {isPending ? (
              <>
                <span className="spinner" />
                Enviando correo...
              </>
            ) : cooldown > 0 ? (
              `Esperá ${cooldown}s`
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

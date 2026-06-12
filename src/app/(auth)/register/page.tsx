"use client";

import { register } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState, useState, useEffect } from "react";

export default function RegisterPage() {
  const [cooldown, setCooldown] = useState<number>(0);

  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: { error?: string; rateLimit?: boolean } | undefined,
      formData: FormData
    ) => {
      const res = await register(formData);
      if (res?.rateLimit) {
        localStorage.setItem("last_register_email_time", Date.now().toString());
      }
      return res;
    },
    undefined
  );

  useEffect(() => {
    const checkCooldown = () => {
      const lastSent = localStorage.getItem("last_register_email_time");
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
            disabled={isPending || cooldown > 0}
          >
            {isPending ? (
              <>
                <span className="spinner" />
                Creando cuenta...
              </>
            ) : cooldown > 0 ? (
              `Esperá ${cooldown}s`
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

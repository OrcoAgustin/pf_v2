"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Mail,
  Coins,
  LogOut,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { updateProfile, updatePassword } from "@/app/actions/profile";
import { logout } from "@/app/actions/auth";

interface ProfileClientProps {
  email: string;
  initialDisplayName: string;
  initialPreferredCurrency: "ARS" | "USD";
}

export default function ProfileClient({
  email,
  initialDisplayName,
  initialPreferredCurrency,
}: ProfileClientProps) {
  const router = useRouter();
  const [isProfilePending, startProfileTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // Estados de Formulario de Perfil
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [preferredCurrency, setPreferredCurrency] = useState<"ARS" | "USD">(
    initialPreferredCurrency
  );
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Estados de Formulario de Contraseña
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!displayName.trim()) {
      setProfileError("El nombre para mostrar es obligatorio.");
      return;
    }

    startProfileTransition(async () => {
      const res = await updateProfile({
        displayName: displayName.trim(),
        preferredCurrency,
      });

      if (res.error) {
        setProfileError(res.error);
      } else {
        setProfileSuccess("¡Perfil actualizado con éxito!");
        router.refresh();
      }
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword) {
      setPasswordError("La contraseña nueva es requerida.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    startPasswordTransition(async () => {
      const res = await updatePassword(newPassword);

      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess("¡Contraseña actualizada con éxito!");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  return (
    <div
      className="fade-in"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Header */}
      <div>
        <h2
          style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          Mi Perfil y Configuración
        </h2>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "14px",
            marginTop: "4px",
          }}
        >
          Administra tus datos personales, preferencias de visualización y contraseña.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Tarjeta de Resumen y Acciones Rápidas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            className="card"
            style={{
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
              borderColor: "rgba(99, 102, 241, 0.15)",
              padding: "32px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "var(--gradient-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color: "white",
                marginBottom: "20px",
                boxShadow: "var(--shadow-glow), 0 0 30px rgba(99, 102, 241, 0.3)",
              }}
            >
              {getInitials(displayName)}
            </div>

            {/* User Name & Email */}
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                marginBottom: "4px",
              }}
            >
              {displayName}
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-muted)",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                justifyContent: "center",
              }}
            >
              <Mail size={14} />
              {email}
            </p>

            <div
              style={{
                width: "100%",
                borderTop: "1px solid var(--color-border)",
                paddingTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Moneda Preferida Badge */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>Moneda por defecto:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-accent-hover)",
                    background: "rgba(99, 102, 241, 0.15)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                  }}
                >
                  {preferredCurrency}
                </span>
              </div>

              {/* Email verificado status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span>Estado de cuenta:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-success)",
                    background: "var(--color-success-glow)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  Verificada
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Seguridad Informativa / Cierre de sesión */}
          <div
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <ShieldAlert
                size={20}
                style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: "2px" }}
              />
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Zona de Seguridad
                </h4>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    lineHeight: "1.5",
                    marginTop: "4px",
                  }}
                >
                  Para cambiar el correo electrónico asociado, por favor ponte en contacto con soporte técnico para evitar bloqueos.
                </p>
              </div>
            </div>

            <form action={logout}>
              <button
                type="submit"
                className="btn btn-ghost btn-full"
                style={{
                  color: "var(--color-danger)",
                  borderColor: "rgba(239, 68, 68, 0.2)",
                  marginTop: "8px",
                }}
              >
                <LogOut size={16} />
                Cerrar Sesión Activa
              </button>
            </form>
          </div>
        </div>

        {/* Formularios de Configuración */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Formulario 1: Datos Personales */}
          <div className="card" style={{ padding: "28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <User size={20} style={{ color: "var(--color-accent-hover)" }} />
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                Datos del Perfil
              </h3>
            </div>

            {profileError && (
              <div className="auth-error" style={{ marginBottom: "20px" }}>
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div
                style={{
                  background: "var(--color-success-glow)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  color: "#a7f3d0",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form
              onSubmit={handleUpdateProfile}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Campo Nombre */}
              <div className="input-group">
                <label className="input-label" htmlFor="display-name">
                  Nombre para mostrar
                </label>
                <input
                  id="display-name"
                  type="text"
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre completo o alias"
                  maxLength={50}
                  required
                  disabled={isProfilePending}
                />
              </div>

              {/* Campo Email (Lectura) */}
              <div className="input-group">
                <label className="input-label" htmlFor="email-disabled">
                  Correo electrónico (No editable)
                </label>
                <input
                  id="email-disabled"
                  type="email"
                  className="input"
                  value={email}
                  disabled
                  style={{
                    opacity: 0.6,
                    cursor: "not-allowed",
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                />
              </div>

              {/* Campo Moneda de Preferencia */}
              <div className="input-group">
                <label className="input-label">Moneda preferida</label>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setPreferredCurrency("ARS")}
                    disabled={isProfilePending}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      background:
                        preferredCurrency === "ARS"
                          ? "rgba(99, 102, 241, 0.15)"
                          : "var(--color-bg-input)",
                      border:
                        preferredCurrency === "ARS"
                          ? "1.5px solid var(--color-accent-hover)"
                          : "1px solid var(--color-border)",
                      color:
                        preferredCurrency === "ARS"
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                      fontWeight: preferredCurrency === "ARS" ? 600 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <Coins size={16} />
                    Pesos Argentinos (ARS)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreferredCurrency("USD")}
                    disabled={isProfilePending}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      background:
                        preferredCurrency === "USD"
                          ? "rgba(99, 102, 241, 0.15)"
                          : "var(--color-bg-input)",
                      border:
                        preferredCurrency === "USD"
                          ? "1.5px solid var(--color-accent-hover)"
                          : "1px solid var(--color-border)",
                      color:
                        preferredCurrency === "USD"
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                      fontWeight: preferredCurrency === "USD" ? 600 : 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <Coins size={16} />
                    Dólares (USD)
                  </button>
                </div>
              </div>

              {/* Botón Guardar Perfil */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: "8px" }}
                disabled={isProfilePending}
              >
                {isProfilePending ? (
                  <div className="spinner" />
                ) : (
                  "Guardar Cambios de Perfil"
                )}
              </button>
            </form>
          </div>

          {/* Formulario 2: Cambiar Contraseña */}
          <div className="card" style={{ padding: "28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <KeyRound size={20} style={{ color: "var(--color-accent-hover)" }} />
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                Seguridad y Contraseña
              </h3>
            </div>

            {passwordError && (
              <div className="auth-error" style={{ marginBottom: "20px" }}>
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div
                style={{
                  background: "var(--color-success-glow)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  color: "#a7f3d0",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                <CheckCircle2 size={16} style={{ color: "var(--color-success)" }} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form
              onSubmit={handleUpdatePassword}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Nueva Contraseña */}
              <div className="input-group">
                <label className="input-label" htmlFor="new-password">
                  Nueva contraseña (mínimo 6 caracteres)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="new-password"
                    type="password"
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isPasswordPending}
                    style={{ paddingLeft: "40px" }}
                  />
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                    }}
                  />
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div className="input-group">
                <label className="input-label" htmlFor="confirm-password">
                  Confirmar nueva contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="confirm-password"
                    type="password"
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isPasswordPending}
                    style={{ paddingLeft: "40px" }}
                  />
                  <Lock
                    size={16}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-text-muted)",
                    }}
                  />
                </div>
              </div>

              {/* Botón Cambiar Contraseña */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: "8px" }}
                disabled={isPasswordPending}
              >
                {isPasswordPending ? (
                  <div className="spinner" />
                ) : (
                  "Actualizar Contraseña"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

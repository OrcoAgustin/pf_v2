import { User, AlertCircle } from "lucide-react";

export default function ProfilePlaceholderPage() {
  return (
    <div
      className="fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60dvh",
        padding: "24px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 32px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
          borderColor: "rgba(99, 102, 241, 0.2)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "var(--radius-md)",
            background: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-accent-hover)",
            marginBottom: "24px",
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.15)",
          }}
        >
          <User size={32} />
        </div>

        <h2
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "12px",
          }}
        >
          Fase 6: Perfil y Configuración
        </h2>

        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "14px",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}
        >
          Próximamente podrás editar tus datos de perfil, cambiar tu moneda predeterminada y configurar alertas de gastos.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-text-muted)",
            fontSize: "12px",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <AlertCircle size={14} style={{ color: "var(--color-accent-hover)" }} />
          <span>Sesiones y autenticación activas.</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Tag,
  Lock,
  AlertCircle,
  TrendingDown,
  Layers,
  PieChart,
  Info
} from "lucide-react";
import { addCategory, updateCategory, deleteCategory } from "@/app/actions/categories";
import type { CategoryWithUsage } from "./page";

interface CategoriesClientProps {
  initialPreferredCurrency: string;
  categories: CategoryWithUsage[];
}

// Colores sugeridos premium
const PRESET_COLORS = [
  { value: "#FF6B6B", name: "Coral" },
  { value: "#4ECDC4", name: "Turquesa" },
  { value: "#FFE66D", name: "Amarillo" },
  { value: "#A855F7", name: "Púrpura" },
  { value: "#22D3EE", name: "Cian" },
  { value: "#3B82F6", name: "Azul" },
  { value: "#F97316", name: "Naranja" },
  { value: "#EC4899", name: "Rosa" },
  { value: "#6366F1", name: "Índigo" },
  { value: "#D946EF", name: "Fucsia" },
  { value: "#10B981", name: "Esmeralda" },
  { value: "#84CC16", name: "Lima" },
];

// Emojis sugeridos por categoría de uso común
const PRESET_EMOJIS = [
  "🍔", "🍕", "🚗", "🚲", "💡", "🔌", "🎮", "🎬", 
  "🏥", "💊", "📚", "🏫", "🏠", "🛋️", "👕", "👟", 
  "📦", "🛒", "🔄", "🐾", "💰", "🍽️", "✈️", "🎨", 
  "🏋️", "🔑", "🎁", "🚀", "🍷", "⚽", "🎸", "📱", 
  "💻", "💼", "🪴", "🛠️", "🔔", "📎"
];

export default function CategoriesClient({
  categories,
}: CategoriesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados del Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithUsage | null>(null);

  // Formulario
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#94A3B8");
  
  const [error, setError] = useState<string | null>(null);

  // Contadores generales
  const totalCount = categories.length;
  const globalCount = categories.filter((c) => !c.user_id).length;
  const customCount = categories.filter((c) => !!c.user_id).length;

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setIcon("📦");
    setColor("#6366F1"); // color default indigo
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryWithUsage) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }
    if (!icon.trim()) {
      setError("Debes seleccionar un ícono emoji.");
      return;
    }

    startTransition(async () => {
      const input = {
        name: name.trim(),
        icon: icon.trim(),
        color: color.trim(),
      };

      let res;
      if (editingCategory) {
        res = await updateCategory(editingCategory.id, input);
      } else {
        res = await addCategory(input);
      }

      if (res.error) {
        setError(res.error);
      } else {
        setIsModalOpen(false);
        router.refresh();
      }
    });
  };

  const handleDelete = (cat: CategoryWithUsage) => {
    // Alertas premium basadas en el uso
    const usageText = 
      cat.expensesCount > 0 || cat.installmentsCount > 0
        ? `\n\n⚠️ ¡ATENCIÓN! Esta categoría está asignada a ${cat.expensesCount} gastos y ${cat.installmentsCount} compras en cuotas. Si la eliminas, estos registros pasarán automáticamente a figurar sin categoría ("Otros").`
        : "";

    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la categoría "${cat.icon} ${cat.name}"?${usageText}\n\nEsta acción no se puede deshacer.`
      )
    )
      return;

    startTransition(async () => {
      const res = await deleteCategory(cat.id);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Categorías de Gastos
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Administra las categorías de tus consumos. Crea tus propias categorías para personalizar tus dashboards.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      {/* Métricas e Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Total Categorías */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
            borderColor: "rgba(99, 102, 241, 0.15)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-accent-hover)",
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Categorías Totales
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {totalCount}
            </div>
          </div>
        </div>

        {/* Globales */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(148, 163, 184, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
            borderColor: "rgba(148, 163, 184, 0.15)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(148, 163, 184, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
            }}
          >
            <Info size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Estándar (Globales)
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {globalCount}
            </div>
          </div>
        </div>

        {/* Personalizadas */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
            borderColor: "rgba(16, 185, 129, 0.15)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-accent-hover)",
            }}
          >
            <PieChart size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Personalizadas (Custom)
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {customCount}
            </div>
          </div>
        </div>
      </div>

      {/* Grilla de Categorías */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {categories.map((cat) => {
          const isGlobal = !cat.user_id;
          
          return (
            <div
              key={cat.id}
              className="card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "170px",
                borderLeft: `4px solid ${cat.color}`,
                background: `linear-gradient(135deg, ${cat.color}08 0%, rgba(18, 18, 26, 0.7) 100%)`,
                transition: "transform var(--transition-fast), border-color var(--transition-fast)",
                position: "relative",
              }}
            >
              {/* Parte Superior */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: `${cat.color}20`,
                      border: `1px solid ${cat.color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    {cat.icon}
                  </div>

                  {/* Badge Tipo */}
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: isGlobal ? "rgba(255, 255, 255, 0.05)" : "rgba(16, 185, 129, 0.1)",
                      color: isGlobal ? "var(--color-text-muted)" : "var(--color-accent-hover)",
                      border: `1px solid ${isGlobal ? "var(--color-border)" : "rgba(16, 185, 129, 0.2)"}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {isGlobal && <Lock size={10} />}
                    {isGlobal ? "Estándar" : "Personalizada"}
                  </span>
                </div>

                {/* Nombre de la Categoría */}
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginTop: "16px",
                  }}
                >
                  {cat.name}
                </h3>
              </div>

              {/* Parte Inferior: Estadísticas y Botones */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "12px",
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "12px",
                }}
              >
                {/* Stats de uso */}
                <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {cat.expensesCount === 0 && cat.installmentsCount === 0 ? (
                    <span>Sin uso activo</span>
                  ) : (
                    <div style={{ display: "flex", gap: "6px" }}>
                      {cat.expensesCount > 0 && (
                        <span style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1px 5px", borderRadius: "3px" }}>
                          {cat.expensesCount} {cat.expensesCount === 1 ? "gasto" : "gastos"}
                        </span>
                      )}
                      {cat.installmentsCount > 0 && (
                        <span style={{ background: "rgba(255, 255, 255, 0.03)", padding: "1px 5px", borderRadius: "3px" }}>
                          {cat.installmentsCount} {cat.installmentsCount === 1 ? "cuota" : "cuotas"}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                {!isGlobal ? (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "5px", borderRadius: "var(--radius-sm)" }}
                      title="Editar categoría"
                      disabled={isPending}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        padding: "5px",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-danger)",
                        borderColor: "rgba(239, 68, 68, 0.15)",
                      }}
                      title="Eliminar categoría"
                      disabled={isPending}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div style={{ height: "28px" }} /> // placeholder para mantener balance
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CRUD (GLASSMORPHISM) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
          onClick={() => { if (!isPending) setIsModalOpen(false); }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "rgba(18, 18, 26, 0.96)",
              borderColor: "var(--color-border-hover)",
              boxShadow: "var(--shadow-lg), 0 0 50px rgba(99,102,241,0.08)",
              animation: "cardAppear 0.25s ease-out",
              maxHeight: "90dvh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría Personalizada"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: "4px", borderRadius: "50%", border: "none" }}
                disabled={isPending}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error" style={{ marginBottom: "20px" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Fila: Vista Previa e Icono + Nombre */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}>
                {/* Vista previa circular del ícono con el color elegido */}
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: `${color}25`,
                    border: `2px solid ${color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    flexShrink: 0,
                    boxShadow: `0 0 20px ${color}15`,
                    transition: "all 0.2s",
                  }}
                >
                  {icon}
                </div>

                {/* Nombre */}
                <div className="input-group" style={{ marginBottom: "0", flex: 1 }}>
                  <label className="input-label" htmlFor="category-name-input">
                    Nombre de la Categoría
                  </label>
                  <input
                    id="category-name-input"
                    type="text"
                    placeholder="Ej: Gimnasio, Inversiones..."
                    className="input"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                    maxLength={50}
                  />
                </div>
              </div>

              {/* Selector de Íconos sugeridos */}
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label">
                  Selecciona un Ícono (Emoji)
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(10, 1fr)",
                    gap: "6px",
                    background: "rgba(255,255,255,0.01)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px",
                    maxHeight: "130px",
                    overflowY: "auto",
                  }}
                >
                  {PRESET_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      style={{
                        fontSize: "20px",
                        background: icon === emoji ? "rgba(99, 102, 241, 0.15)" : "transparent",
                        border: icon === emoji ? "1px solid var(--color-accent-hover)" : "1px solid transparent",
                        borderRadius: "6px",
                        height: "36px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                
                {/* Entrada libre para otro emoji */}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    ¿No encontrás el tuyo? Pegá otro emoji aquí:
                  </span>
                  <input
                    type="text"
                    className="input"
                    value={icon}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Tomar solo el primer caracter/emoji ingresado
                      if (val) {
                        setIcon(Array.from(val)[0] || "📦");
                      } else {
                        setIcon("");
                      }
                    }}
                    style={{ width: "50px", textAlign: "center", padding: "4px", height: "30px", fontSize: "14px" }}
                    placeholder="📦"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Selector de Colores */}
              <div className="input-group" style={{ marginBottom: "0" }}>
                <label className="input-label">
                  Color Identificador
                </label>
                
                {/* Presets */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setColor(col.value)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: col.value,
                        border: color === col.value ? "2px solid #ffffff" : "2px solid transparent",
                        cursor: "pointer",
                        boxShadow: color === col.value ? `0 0 10px ${col.value}` : "none",
                        transition: "transform 0.15s",
                        transform: color === col.value ? "scale(1.1)" : "none",
                      }}
                      title={col.name}
                    />
                  ))}
                </div>

                {/* Custom Color Picker */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    Color personalizado:
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      style={{
                        border: "none",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        background: "transparent",
                      }}
                      disabled={isPending}
                    />
                    <input
                      type="text"
                      className="input"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#6366F1"
                      style={{ width: "100px", padding: "4px 8px", height: "30px", fontSize: "12px" }}
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: "120px" }}
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="spinner" />
                  ) : editingCategory ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Categoría"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  TrendingDown,
  FilterX,
  Lock,
  ExternalLink
} from "lucide-react";
import { addExpense, updateExpense, deleteExpense } from "@/app/actions/expenses";
import type { ExpenseWithCategory, Category } from "@/lib/supabase/types";

interface ExpensesClientProps {
  initialPreferredCurrency: "ARS" | "USD";
  initialExpenses: ExpenseWithCategory[];
  categories: Category[];
}

export default function ExpensesClient({
  initialPreferredCurrency,
  initialExpenses,
  categories,
}: ExpensesClientProps) {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>(initialExpenses);
  const [currency, setCurrency] = useState<"ARS" | "USD">(initialPreferredCurrency);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  
  // Filtro de mes (Formato YYYY-MM) o "all"
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "2026-06"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [viewAllMonths, setViewAllMonths] = useState(false);

  // Estados del Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);
  
  // Formulario
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCurrency, setFormCurrency] = useState<"ARS" | "USD">(currency);
  
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Abrir modal para crear
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setDescription("");
    setAmount("");
    setCategoryId(categories[0]?.id || "");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setFormCurrency(currency);
    setError(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategoryId(expense.category_id || "");
    setExpenseDate(expense.date);
    setFormCurrency(expense.currency);
    setError(null);
    setIsModalOpen(true);
  };

  // Guardar datos (Crear o Editar)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser un número mayor a cero.");
      return;
    }

    startTransition(async () => {
      const input = {
        description,
        amount: parsedAmount,
        category_id: categoryId || null,
        currency: formCurrency,
        date: expenseDate,
      };

      if (editingExpense) {
        const res = await updateExpense(editingExpense.id, input);
        if (res.error) {
          setError(res.error);
        } else {
          // Actualizar estado cliente reactivamente
          setExpenses((prev) =>
            prev.map((item) =>
              item.id === editingExpense.id
                ? {
                    ...item,
                    ...res.data,
                    category: categories.find((c) => c.id === categoryId) || null,
                  }
                : item
            )
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await addExpense(input);
        if (res.error) {
          setError(res.error);
        } else {
          // Agregar al estado cliente
          setExpenses((prev) => [
            {
              ...res.data,
              category: categories.find((c) => c.id === categoryId) || null,
            } as ExpenseWithCategory,
            ...prev,
          ]);
          setIsModalOpen(false);
        }
      }
    });
  };

  // Eliminar un gasto
  const handleDelete = (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto?")) return;

    startTransition(async () => {
      const res = await deleteExpense(id);
      if (res.error) {
        alert(res.error);
      } else {
        // Remover del estado cliente
        setExpenses((prev) => prev.filter((item) => item.id !== id));
      }
    });
  };

  // Filtrado de la lista en memoria
  const filteredExpenses = expenses.filter((ex) => {
    // 1. Filtrar por Moneda
    if (ex.currency !== currency) return false;

    // 2. Filtrar por Búsqueda de Texto
    if (
      searchQuery.trim() !== "" &&
      !ex.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // 3. Filtrar por Categoría
    if (selectedCategoryId !== "all" && ex.category_id !== selectedCategoryId) {
      return false;
    }

    // 4. Filtrar por Mes (YYYY-MM)
    if (!viewAllMonths) {
      const expenseMonth = ex.date.slice(0, 7); // Toma "YYYY-MM" de "YYYY-MM-DD"
      if (expenseMonth !== selectedMonth) return false;
    }

    return true;
  });

  // Calcular suma total filtrada
  const filteredTotal = filteredExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  // Formateadores
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
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
            Gestión de Gastos
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Administra tus consumos individuales y visualiza totales agrupados.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      {/* Tarjeta de Resumen Rápido de Filtros */}
      <div
        className="card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-accent-hover)",
            }}
          >
            <TrendingDown size={20} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Total Gastos Seleccionados
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {formatCurrency(filteredTotal)}
            </div>
          </div>
        </div>

        {/* Currency Selector */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "3px",
          }}
        >
          <button
            onClick={() => { setCurrency("ARS"); setFormCurrency("ARS"); }}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: currency === "ARS" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: currency === "ARS" ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            ARS
          </button>
          <button
            onClick={() => { setCurrency("USD"); setFormCurrency("USD"); }}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: currency === "USD" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: currency === "USD" ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            USD
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          padding: "20px",
        }}
      >
        {/* Búsqueda por texto */}
        <div className="input-group">
          <label className="input-label" htmlFor="search-input">
            🔍 Buscar Descripción
          </label>
          <div style={{ position: "relative" }}>
            <input
              id="search-input"
              type="text"
              placeholder="Ej: Supermercado Coto..."
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px" }}
            />
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
              }}
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="input-group">
          <label className="input-label" htmlFor="category-filter">
            🏷️ Categoría
          </label>
          <select
            id="category-filter"
            className="input"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Mes */}
        <div className="input-group">
          <label className="input-label" htmlFor="month-filter">
            📅 Mes de Consumo
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              id="month-filter"
              type="month"
              className="input"
              disabled={viewAllMonths}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                cursor: viewAllMonths ? "not-allowed" : "pointer",
                opacity: viewAllMonths ? 0.4 : 1,
              }}
            />
            <button
              onClick={() => setViewAllMonths(!viewAllMonths)}
              className="btn btn-ghost btn-sm"
              style={{
                padding: "11px",
                minWidth: "75px",
                background: viewAllMonths ? "rgba(99, 102, 241, 0.1)" : "transparent",
                color: viewAllMonths ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
                borderColor: viewAllMonths ? "var(--color-border-hover)" : "var(--color-border)",
              }}
            >
              {viewAllMonths ? "Meses" : "Todos"}
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor del Listado (Tabla o Cards en Mobile) */}
      {filteredExpenses.length === 0 ? (
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 40px",
            color: "var(--color-text-muted)",
            gap: "16px",
          }}
        >
          <FilterX size={44} style={{ opacity: 0.4 }} />
          <div style={{ textAlign: "center" }}>
            <h4 style={{ color: "var(--color-text-primary)", fontWeight: 600, fontSize: "16px" }}>
              Sin gastos cargados
            </h4>
            <p style={{ fontSize: "13px", marginTop: "4px", maxWidth: "320px" }}>
              No se encontraron registros en {currency} para los filtros seleccionados. Probá modificando el mes o registrando un nuevo gasto.
            </p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "0", overflow: "hidden" }}>
          {/* Vista Tabla Desktop */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: "18px 24px" }}>Fecha</th>
                  <th style={{ padding: "18px 24px" }}>Descripción</th>
                  <th style={{ padding: "18px 24px" }}>Categoría</th>
                  <th style={{ padding: "18px 24px", textAlign: "right" }}>Monto</th>
                  <th style={{ padding: "18px 24px", textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((ex) => (
                  <tr
                    key={ex.id}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      transition: "background var(--transition-fast)",
                    }}
                    className="card-hover-table-row"
                  >
                    <td style={{ padding: "16px 24px", color: "var(--color-text-secondary)" }}>
                      {formatDate(ex.date)}
                    </td>
                    <td style={{ padding: "16px 24px", fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{ex.description}</span>
                        {ex.installment_purchase_id && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--color-warning)",
                              background: "rgba(245, 158, 11, 0.08)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 600,
                            }}
                          >
                            Cuota {ex.installment_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          background: ex.category?.color ? `${ex.category.color}15` : "rgba(255,255,255,0.05)",
                          border: `1px solid ${ex.category?.color || "var(--color-border)"}25`,
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        <span>{ex.category?.icon || "📦"}</span>
                        <span>{ex.category?.name || "Otros"}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "16px 24px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {formatCurrency(ex.amount)}
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      {ex.installment_purchase_id ? (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <Link
                            href="/installments"
                            className="btn btn-ghost btn-sm"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "11px",
                              padding: "6px 10px",
                              color: "var(--color-warning)",
                              borderColor: "rgba(245, 158, 11, 0.2)",
                              background: "rgba(245, 158, 11, 0.03)",
                            }}
                            title="Gestionar en Cuotas"
                          >
                            <Lock size={11} />
                            <span>Ver Cuotas</span>
                            <ExternalLink size={10} />
                          </Link>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleOpenEdit(ex)}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: "6px", borderRadius: "var(--radius-sm)" }}
                            title="Editar gasto"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(ex.id)}
                            className="btn btn-ghost btn-sm"
                            style={{
                              padding: "6px",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--color-danger)",
                              borderColor: "rgba(239, 68, 68, 0.15)",
                            }}
                            title="Eliminar gasto"
                            disabled={isPending}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CRUD (GLASSMORPHISM) */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
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
              maxWidth: "480px",
              background: "rgba(18, 18, 26, 0.95)",
              borderColor: "var(--color-border-hover)",
              boxShadow: "var(--shadow-lg), 0 0 40px rgba(99,102,241,0.05)",
              animation: "cardAppear 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer click adentro
          >
            {/* Header Modal */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {editingExpense ? "Editar Gasto" : "Registrar Nuevo Gasto"}
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
              <div
                className="auth-error"
                style={{ marginBottom: "20px" }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Descripción */}
              <div className="input-group">
                <label className="input-label" htmlFor="form-description">
                  Descripción
                </label>
                <input
                  id="form-description"
                  type="text"
                  placeholder="Ej: Cena con amigos"
                  className="input"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {/* Fila: Monto + Moneda */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="form-amount">
                    Monto
                  </label>
                  <input
                    id="form-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="input"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="form-currency">
                    Moneda
                  </label>
                  <select
                    id="form-currency"
                    className="input"
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value as "ARS" | "USD")}
                    disabled={isPending}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {/* Categoría */}
              <div className="input-group">
                <label className="input-label" htmlFor="form-category">
                  Categoría
                </label>
                <select
                  id="form-category"
                  className="input"
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={isPending}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha */}
              <div className="input-group">
                <label className="input-label" htmlFor="form-date">
                  Fecha
                </label>
                <input
                  id="form-date"
                  type="date"
                  className="input"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
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
                  ) : editingExpense ? (
                    "Guardar Cambios"
                  ) : (
                    "Registrar Gasto"
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

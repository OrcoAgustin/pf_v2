"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  TrendingDown,
  FilterX,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock
} from "lucide-react";
import { addInstallmentPurchase, updateInstallmentPurchase, deleteInstallmentPurchase } from "@/app/actions/installments";
import type { PurchaseInstallmentWithCategory } from "./page";
import type { Category, Expense } from "@/lib/supabase/types";

interface InstallmentsClientProps {
  initialPreferredCurrency: "ARS" | "USD";
  categories: Category[];
  initialPurchases: PurchaseInstallmentWithCategory[];
  installmentExpenses: Pick<Expense, "id" | "amount" | "date" | "installment_purchase_id" | "installment_number">[];
}

export default function InstallmentsClient({
  initialPreferredCurrency,
  categories,
  initialPurchases,
  installmentExpenses,
}: InstallmentsClientProps) {
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseInstallmentWithCategory[]>(initialPurchases);
  const [currency, setCurrency] = useState<"ARS" | "USD">(initialPreferredCurrency);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  // Control de accordions de detalles abiertos por purchase.id
  const [expandedPurchaseIds, setExpandedPurchaseIds] = useState<Record<string, boolean>>({});

  // Estados del Modal CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseInstallmentWithCategory | null>(null);

  // Formulario
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [formCurrency, setFormCurrency] = useState<"ARS" | "USD">(currency);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const todayStr = new Date().toISOString().split("T")[0];

  const toggleAccordion = (id: string) => {
    setExpandedPurchaseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenAdd = () => {
    setEditingPurchase(null);
    setDescription("");
    setTotalAmount("");
    setTotalInstallments("12");
    setInterestRate("0");
    setStartDate(new Date().toISOString().split("T")[0]);
    setCategoryId(categories[0]?.id || "");
    setFormCurrency(currency);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (purchase: PurchaseInstallmentWithCategory) => {
    setEditingPurchase(purchase);
    setDescription(purchase.description);
    setTotalAmount(purchase.total_amount.toString());
    setTotalInstallments(purchase.total_installments.toString());
    setInterestRate(purchase.interest_rate.toString());
    setStartDate(purchase.start_date);
    setCategoryId(purchase.category_id || "");
    setFormCurrency(purchase.currency);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(totalAmount);
    const parsedInstallments = parseInt(totalInstallments, 10);
    const parsedInterest = parseFloat(interestRate);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("El monto total debe ser un número mayor a cero.");
      return;
    }
    if (isNaN(parsedInstallments) || parsedInstallments <= 0) {
      setError("La cantidad de cuotas debe ser mayor a cero.");
      return;
    }
    if (isNaN(parsedInterest) || parsedInterest < 0) {
      setError("La tasa de interés no puede ser negativa.");
      return;
    }

    startTransition(async () => {
      const input = {
        description,
        total_amount: parsedAmount,
        total_installments: parsedInstallments,
        interest_rate: parsedInterest,
        currency: formCurrency,
        start_date: startDate,
        category_id: categoryId || null,
      };

      let res;
      if (editingPurchase) {
        res = await updateInstallmentPurchase(editingPurchase.id, input);
      } else {
        res = await addInstallmentPurchase(input);
      }

      if (res.error) {
        setError(res.error);
      } else {
        setIsModalOpen(false);
        // Recargar datos del servidor para actualizar props y sincronizar tablas
        router.refresh();
        // Para asegurar una sincronización inmediata en el state de react:
        window.location.reload();
      }
    });
  };

  const handleDelete = (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta compra en cuotas? Se eliminarán automáticamente todos los gastos mensuales asociados."
      )
    )
      return;

    startTransition(async () => {
      const res = await deleteInstallmentPurchase(id);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
        window.location.reload();
      }
    });
  };

  // Helper para verificar si una cuota está pagada (fecha <= hoy)
  const isPaid = (dateStr: string) => dateStr <= todayStr;

  // Cálculos específicos para cada compra en cuotas
  const getPurchaseStats = (purchase: PurchaseInstallmentWithCategory) => {
    const expenses = installmentExpenses.filter((e) => e.installment_purchase_id === purchase.id);
    
    // Cuotas pagadas
    const paidExpenses = expenses.filter((e) => isPaid(e.date));
    const paidCount = paidExpenses.length;
    const paidAmount = paidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Cuotas pendientes
    const pendingExpenses = expenses.filter((e) => !isPaid(e.date));
    const pendingCount = purchase.total_installments - paidCount;
    // El monto pendiente se calcula como total_amount - paidAmount para evitar problemas de redondeo
    const pendingAmount = Math.max(0, purchase.total_amount - paidAmount);

    // Próximo vencimiento
    const sortedPending = [...pendingExpenses].sort((a, b) => a.date.localeCompare(b.date));
    const nextInstallment = sortedPending[0] || null;

    return {
      expenses,
      paidCount,
      paidAmount,
      pendingCount,
      pendingAmount,
      nextInstallment,
      isCompleted: pendingCount === 0 && purchase.total_installments > 0,
    };
  };

  // Filtrado de las compras
  const filteredPurchases = purchases.map((purchase) => {
    const stats = getPurchaseStats(purchase);
    return { ...purchase, stats };
  }).filter((p) => {
    // 1. Moneda
    if (p.currency !== currency) return false;

    // 2. Búsqueda de texto
    if (
      searchQuery.trim() !== "" &&
      !p.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // 3. Categoría
    if (selectedCategoryId !== "all" && p.category_id !== selectedCategoryId) {
      return false;
    }

    // 4. Estado (Activo / Finalizado)
    if (statusFilter === "active" && p.stats.isCompleted) return false;
    if (statusFilter === "completed" && !p.stats.isCompleted) return false;

    return true;
  });

  // Métricas generales (en base al filtro de moneda actual)
  const allCurrentCurrencyExpenses = installmentExpenses.filter((e) => {
    const p = purchases.find((pur) => pur.id === e.installment_purchase_id);
    return p?.currency === currency;
  });

  // 1. Total compromiso en cuotas (futuras)
  const totalCompromiso = allCurrentCurrencyExpenses
    .filter((e) => !isPaid(e.date))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // 2. Cantidad de cuotas activas
  const activePurchasesCount = purchases
    .filter((p) => p.currency === currency)
    .filter((p) => {
      const stats = getPurchaseStats(p);
      return !stats.isCompleted;
    }).length;

  // 3. Próximo vencimiento absoluto en esta moneda
  const nextAbsoluteExpense = allCurrentCurrencyExpenses
    .filter((e) => !isPaid(e.date))
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;

  const nextAbsolutePurchase = nextAbsoluteExpense
    ? purchases.find((p) => p.id === nextAbsoluteExpense.installment_purchase_id)
    : null;

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
            Financiación en Cuotas
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginTop: "4px" }}>
            Registra tus consumos financiados, proyecta gastos futuros y monitorea saldos pendientes.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Plus size={18} />
          Registrar Compra
        </button>
      </div>

      {/* Métricas e Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Compromiso Total */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
            borderColor: "rgba(239, 68, 68, 0.15)",
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
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-danger)",
            }}
          >
            <TrendingDown size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Compromiso Pendiente
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {formatCurrency(totalCompromiso)}
            </div>
          </div>
        </div>

        {/* Cuotas Activas */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(26, 26, 46, 0.6) 100%)",
            borderColor: "rgba(245, 158, 11, 0.15)",
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
              background: "rgba(245, 158, 11, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-warning)",
            }}
          >
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Compras Activas
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
              {activePurchasesCount} {activePurchasesCount === 1 ? "compra" : "compras"}
            </div>
          </div>
        </div>

        {/* Próximo Vencimiento */}
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
            <Calendar size={22} />
          </div>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: 500 }}>
              Próximo Vencimiento
            </div>
            {nextAbsoluteExpense ? (
              <div style={{ marginTop: "2px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {formatCurrency(nextAbsoluteExpense.amount)}
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "6px" }}>
                  el {new Date(nextAbsoluteExpense.date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                </span>
                <div style={{ fontSize: "11px", color: "var(--color-accent-hover)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginTop: "1px" }}>
                  {nextAbsolutePurchase?.description}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-secondary)", marginTop: "4px" }}>
                Ninguno pendiente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          padding: "20px",
          alignItems: "end",
        }}
      >
        {/* Búsqueda por texto */}
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="search-input">
            🔍 Buscar Descripción
          </label>
          <input
            id="search-input"
            type="text"
            placeholder="Ej: Notebook, Samsung..."
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categorías */}
        <div className="input-group" style={{ marginBottom: "0" }}>
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

        {/* Estado */}
        <div className="input-group" style={{ marginBottom: "0" }}>
          <label className="input-label" htmlFor="status-filter">
            🚦 Estado
          </label>
          <select
            id="status-filter"
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "completed")}
            style={{ cursor: "pointer" }}
          >
            <option value="all">Todas las compras</option>
            <option value="active">Activas (con cuotas pendientes)</option>
            <option value="completed">Finalizadas (todo pagado)</option>
          </select>
        </div>

        {/* Selector de Moneda */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              display: "flex",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "3px",
              height: "42px",
              alignItems: "center",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginLeft: "12px", fontWeight: 500 }}>
              Moneda:
            </span>
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                onClick={() => setCurrency("ARS")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: currency === "ARS" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: currency === "ARS" ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                ARS
              </button>
              <button
                onClick={() => setCurrency("USD")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: currency === "USD" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: currency === "USD" ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                USD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Compras en Cuotas */}
      {filteredPurchases.length === 0 ? (
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
              Sin compras en cuotas
            </h4>
            <p style={{ fontSize: "13px", marginTop: "4px", maxWidth: "320px" }}>
              No se encontraron compras en {currency} para los filtros seleccionados. Registrá una nueva para comenzar a planificar.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {filteredPurchases.map((purchase) => {
            const isExpanded = !!expandedPurchaseIds[purchase.id];
            const percentPaid = purchase.stats.paidCount / purchase.total_installments;
            
            return (
              <div
                key={purchase.id}
                className="card"
                style={{
                  padding: "24px",
                  borderLeft: `4px solid ${purchase.category?.color || "var(--color-border)"}`,
                  background: purchase.stats.isCompleted
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(26, 26, 46, 0.4) 100%)"
                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(26, 26, 46, 0.6) 100%)",
                }}
              >
                {/* Cabecera de la Tarjeta */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: purchase.category?.color ? `${purchase.category.color}15` : "rgba(255,255,255,0.05)",
                        border: `1px solid ${purchase.category?.color || "var(--color-border)"}25`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                      }}
                    >
                      {purchase.category?.icon || "📦"}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {purchase.description}
                      </h3>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          {purchase.category?.name || "Otros"}
                        </span>
                        <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--color-text-muted)" }} />
                        <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                          Iniciada el {formatDate(purchase.start_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenEdit(purchase)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "6px", borderRadius: "var(--radius-sm)" }}
                      title="Editar compra"
                      disabled={isPending}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(purchase.id)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        padding: "6px",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-danger)",
                        borderColor: "rgba(239, 68, 68, 0.15)",
                      }}
                      title="Eliminar compra"
                      disabled={isPending}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Sección de Progreso */}
                <div style={{ marginTop: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "8px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      Progreso de Financiación:
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: purchase.stats.isCompleted ? "var(--color-accent-hover)" : "var(--color-warning)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {purchase.stats.isCompleted ? (
                        <>
                          <CheckCircle2 size={13} /> Finalizada
                        </>
                      ) : (
                        <>
                          <Clock size={13} /> Cuota {purchase.stats.paidCount} de {purchase.total_installments}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Barra de Progreso Visual */}
                  <div
                    style={{
                      height: "8px",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${percentPaid * 100}%`,
                        background: purchase.stats.isCompleted
                          ? "linear-gradient(90deg, #10B981 0%, #059669 100%)"
                          : "linear-gradient(90deg, #6366F1 0%, #4F46E5 100%)",
                        borderRadius: "4px",
                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </div>
                </div>

                {/* Resumen Financiero en Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "12px",
                    marginTop: "20px",
                    background: "rgba(255, 255, 255, 0.01)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Monto Total</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>
                      {formatCurrency(purchase.total_amount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Pagado al Día</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-accent-hover)", marginTop: "2px" }}>
                      {formatCurrency(purchase.stats.paidAmount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Saldo Pendiente</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-warning)", marginTop: "2px" }}>
                      {formatCurrency(purchase.stats.pendingAmount)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Tasa de Interés</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "2px" }}>
                      <Percent size={12} /> {purchase.interest_rate}% <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 400 }}>(inf.)</span>
                    </div>
                  </div>
                </div>

                {/* Próxima Cuota Informativa */}
                {!purchase.stats.isCompleted && purchase.stats.nextInstallment && (
                  <div
                    style={{
                      marginTop: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      background: "rgba(245, 158, 11, 0.04)",
                      border: "1px solid rgba(245, 158, 11, 0.1)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <AlertCircle size={14} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
                    <span>
                      Próximo cobro: <strong>{formatCurrency(purchase.stats.nextInstallment.amount)}</strong> el <strong>{formatDate(purchase.stats.nextInstallment.date)}</strong> (Cuota {purchase.stats.nextInstallment.installment_number}/{purchase.total_installments})
                    </span>
                  </div>
                )}

                {/* Botón Acordeón Detalle */}
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={() => toggleAccordion(purchase.id)}
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: "100%",
                      maxWidth: "240px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "11px",
                      borderColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    {isExpanded ? (
                      <>
                        Ocultar plan de cuotas <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        Ver plan de cuotas ({purchase.stats.expenses.length} meses) <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                </div>

                {/* Contenido Acordeón Detalle */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: "16px",
                      borderTop: "1px dashed var(--color-border)",
                      paddingTop: "16px",
                      animation: "fade-in 0.2s ease-out",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "10px",
                      }}
                    >
                      {[...purchase.stats.expenses]
                        .sort((a, b) => (a.installment_number ?? 0) - (b.installment_number ?? 0))
                        .map((exp) => {
                          const paid = isPaid(exp.date);
                          return (
                            <div
                              key={exp.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px 12px",
                                background: paid ? "rgba(16, 185, 129, 0.03)" : "rgba(255,255,255,0.01)",
                                border: `1px solid ${paid ? "rgba(16, 185, 129, 0.1)" : "var(--color-border)"}`,
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                                  Cuota {exp.installment_number}
                                </span>
                                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                  {formatDate(exp.date)}
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                                  {formatCurrency(exp.amount)}
                                </span>
                                <div style={{ marginTop: "2px" }}>
                                  <span
                                    style={{
                                      fontSize: "8px",
                                      fontWeight: 700,
                                      padding: "1px 4px",
                                      borderRadius: "3px",
                                      background: paid ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)",
                                      color: paid ? "var(--color-accent-hover)" : "rgba(129, 140, 248, 1)",
                                    }}
                                  >
                                    {paid ? "PAGADO" : "PENDIENTE"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
                {editingPurchase ? "Editar Compra en Cuotas" : "Registrar Compra en Cuotas"}
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
              <div className="auth-error" style={{ marginBottom: "16px" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Descripción */}
              <div className="input-group">
                <label className="input-label" htmlFor="form-description">
                  Descripción
                </label>
                <input
                  id="form-description"
                  type="text"
                  placeholder="Ej: Celular Samsung, Heladera, etc."
                  className="input"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {/* Fila: Monto Total + Moneda */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="form-amount">
                    Monto Total Financiado
                  </label>
                  <input
                    id="form-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="input"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
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

              {/* Fila: Cuotas + Interés */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <label className="input-label" htmlFor="form-installments">
                    Cantidad de Cuotas
                  </label>
                  <input
                    id="form-installments"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="12"
                    className="input"
                    required
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="form-interest">
                    Tasa de Interés Anual %
                  </label>
                  <input
                    id="form-interest"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="input"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    disabled={isPending}
                    title="Esta tasa es puramente informativa."
                  />
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

              {/* Fecha Inicio (Cuota 1) */}
              <div className="input-group">
                <label className="input-label" htmlFor="form-start-date">
                  Fecha Primer Cuota (Cobro)
                </label>
                <input
                  id="form-start-date"
                  type="date"
                  className="input"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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
                  ) : editingPurchase ? (
                    "Guardar Cambios"
                  ) : (
                    "Registrar Compra"
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

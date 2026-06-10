"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Calendar,
  CreditCard,
  ChevronRight,
  DollarSign,
  ArrowUpRight,
  PieChart as PieIcon,
  Activity,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import type {
  CurrentMonthMetrics,
  MonthlyExpenseByCategory,
  MonthlyTotal,
  ExpenseWithCategory
} from "@/lib/supabase/types";

// Tipo extendido para cuota pendiente con información de cuotas
export type UpcomingInstallment = ExpenseWithCategory & {
  purchase?: {
    total_installments: number;
  } | null;
};

interface DashboardClientProps {
  initialPreferredCurrency: "ARS" | "USD";
  metrics: CurrentMonthMetrics[];
  expensesByCategory: MonthlyExpenseByCategory[];
  monthlyTotals: MonthlyTotal[];
  recentExpenses: ExpenseWithCategory[];
  upcomingInstallments: UpcomingInstallment[];
}

export default function DashboardClient({
  initialPreferredCurrency,
  metrics,
  expensesByCategory,
  monthlyTotals,
  recentExpenses,
  upcomingInstallments,
}: DashboardClientProps) {
  const [currency, setCurrency] = useState<"ARS" | "USD">(initialPreferredCurrency);
  const [mounted, setMounted] = useState(false);

  // Garantizar que recharts se renderice solo en cliente para evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Filtrar datos por la moneda seleccionada
  const activeMetrics = metrics.find((m) => m.currency === currency) || {
    user_id: "",
    currency,
    total_month: 0,
    daily_average: 0,
    future_installments_total: 0,
  };

  const activeExpensesByCategory = expensesByCategory.filter(
    (e) => e.currency === currency
  );

  const activeMonthlyTotals = monthlyTotals
    .filter((e) => e.currency === currency)
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const activeRecentExpenses = recentExpenses.filter(
    (e) => e.currency === currency
  );

  const activeUpcomingInstallments = upcomingInstallments.filter(
    (e) => e.currency === currency
  );

  // Formateador de moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Formateador de fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00"); // Evitar desfase de zona horaria
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    });
  };

  // Formateador para leyenda de mes en gráfico
  const formatMonthLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", {
      month: "short",
      year: "2-digit",
    });
  };

  // Datos para gráfico Donut (Pie)
  const pieData = activeExpensesByCategory.map((c) => ({
    name: c.category_name || "Otros",
    value: Number(c.total_amount),
    color: c.category_color || "#94A3B8",
    icon: c.category_icon || "📦",
    count: c.transaction_count,
  }));

  // Datos para gráfico Tendencia
  const trendData = activeMonthlyTotals.map((t) => ({
    name: formatMonthLabel(t.month),
    monto: Number(t.total_amount),
  }));

  // Suma total del gráfico Pie para porcentajes
  const totalPieValue = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header con selector de moneda */}
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
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Hola, <span className="text-gradient">resumen financiero</span> 👋
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "15px" }}>
            Monitorea tus gastos y compromisos de pago en cuotas.
          </p>
        </div>

        {/* Selector de moneda Premium */}
        <div
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "4px",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            onClick={() => setCurrency("ARS")}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: currency === "ARS" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: currency === "ARS" ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              boxShadow: currency === "ARS" ? "0 0 12px rgba(99, 102, 241, 0.15)" : "none",
            }}
          >
            🇦🇷 ARS
          </button>
          <button
            onClick={() => setCurrency("USD")}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: currency === "USD" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              color: currency === "USD" ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              boxShadow: currency === "USD" ? "0 0 12px rgba(99, 102, 241, 0.15)" : "none",
            }}
          >
            🇺🇸 USD
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Total del mes */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-accent-hover)",
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-label">Total Gastado del Mes</div>
            <div className="stat-value" style={{ marginTop: "4px" }}>
              {formatCurrency(activeMetrics.total_month)}
            </div>
          </div>
        </div>

        {/* Promedio diario */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-success)",
            }}
          >
            <Activity size={24} />
          </div>
          <div>
            <div className="stat-label">Promedio Diario</div>
            <div className="stat-value" style={{ marginTop: "4px" }}>
              {formatCurrency(activeMetrics.daily_average)}
            </div>
          </div>
        </div>

        {/* Cuotas pendientes */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-warning)",
            }}
          >
            <CreditCard size={24} />
          </div>
          <div>
            <div className="stat-label">Compromiso en Cuotas Futuras</div>
            <div className="stat-value" style={{ marginTop: "4px" }}>
              {formatCurrency(activeMetrics.future_installments_total)}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Recharts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Gráfico Donut - Categorías */}
        <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: "360px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "20px",
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <PieIcon size={18} style={{ color: "var(--color-accent-hover)" }} />
            Distribución por Categorías
          </h3>

          {!mounted ? (
            // Skeleton de carga para evitar hydration warnings
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div className="spinner" />
            </div>
          ) : pieData.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted)",
                gap: "12px",
              }}
            >
              <AlertCircle size={32} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: "14px" }}>No hay gastos registrados este mes.</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                alignItems: "center",
                flex: 1,
                gap: "12px",
              }}
            >
              {/* Contenedor del gráfico */}
              <div style={{ width: "100%", height: "230px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = ((data.value / totalPieValue) * 100).toFixed(1);
                          return (
                            <div
                              style={{
                                background: "rgba(18, 18, 26, 0.95)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-sm)",
                                padding: "10px 14px",
                                boxShadow: "var(--shadow-lg)",
                                backdropFilter: "blur(12px)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--color-text-primary)" }}>
                                <span>{data.icon}</span>
                                <span>{data.name}</span>
                              </div>
                              <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                                Monto: <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{formatCurrency(data.value)}</span>
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--color-accent-hover)" }}>
                                Porcentaje: <span style={{ fontWeight: 600 }}>{percent}%</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Leyenda Premium */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "230px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {pieData.map((item, index) => {
                  const percent = ((item.value / totalPieValue) * 100).toFixed(0);
                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(255, 255, 255, 0.01)",
                        border: "1px solid transparent",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: item.color,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: "12px", marginRight: "4px" }}>{item.icon}</span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--color-text-secondary)",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Gráfico de Tendencia - Histórico */}
        <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: "360px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "20px",
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <TrendingUp size={18} style={{ color: "var(--color-success)" }} />
            Tendencia de Gastos (Últimos Meses)
          </h3>

          {!mounted ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div className="spinner" />
            </div>
          ) : trendData.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted)",
                gap: "12px",
              }}
            >
              <AlertCircle size={32} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: "14px" }}>No hay historial suficiente para graficar.</p>
            </div>
          ) : (
            <div style={{ width: "100%", height: "230px", flex: 1, marginTop: "10px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="var(--color-text-muted)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div
                            style={{
                              background: "rgba(18, 18, 26, 0.95)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              padding: "10px 14px",
                              boxShadow: "var(--shadow-lg)",
                              backdropFilter: "blur(12px)",
                            }}
                          >
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                              {payload[0].payload.name}
                            </div>
                            <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                              {formatCurrency(payload[0].value as number)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="monto"
                    stroke="var(--color-accent-hover)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMonto)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Widgets Inferiores */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Historial de últimos gastos */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <DollarSign size={18} style={{ color: "var(--color-accent-hover)" }} />
              Últimos Gastos Registrados
            </h3>
            <Link
              href="/expenses"
              className="btn btn-ghost btn-sm"
              style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          {activeRecentExpenses.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted)",
                padding: "40px 0",
                gap: "12px",
              }}
            >
              <AlertCircle size={32} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: "14px" }}>Aún no has registrado gastos en esta moneda.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeRecentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    transition: "all var(--transition-fast)",
                  }}
                  className="card-hover"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-sm)",
                        background: expense.category?.color ? `${expense.category.color}15` : "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${expense.category?.color || "var(--color-border)"}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      {expense.category?.icon || "📦"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {expense.description}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11px",
                          color: "var(--color-text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        <span>{formatDate(expense.date)}</span>
                        {expense.installment_purchase_id && (
                          <>
                            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--color-text-muted)" }} />
                            <span
                              style={{
                                color: "var(--color-warning)",
                                fontWeight: 500,
                                background: "rgba(245, 158, 11, 0.08)",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontSize: "10px",
                              }}
                            >
                              Cuota {expense.installment_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget de cuotas pendientes */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Calendar size={18} style={{ color: "var(--color-warning)" }} />
              Vencimientos en Cuotas
            </h3>
            <Link
              href="/installments"
              className="btn btn-ghost btn-sm"
              style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
            >
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>

          {activeUpcomingInstallments.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted)",
                padding: "40px 0",
                gap: "12px",
              }}
            >
              <AlertCircle size={32} style={{ opacity: 0.5 }} />
              <p style={{ fontSize: "14px" }}>No tienes cuotas pendientes para vencer.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeUpcomingInstallments.map((installment) => {
                const totalInstallments = installment.purchase?.total_installments || "?";
                const isCurrentMonth = new Date(installment.date).getMonth() === new Date().getMonth() &&
                                      new Date(installment.date).getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={installment.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      borderColor: isCurrentMonth ? "rgba(245, 158, 11, 0.2)" : "var(--color-border)",
                      transition: "all var(--transition-fast)",
                    }}
                    className="card-hover"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "var(--radius-sm)",
                          background: isCurrentMonth ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.05)",
                          border: isCurrentMonth
                            ? "1px solid rgba(245, 158, 11, 0.3)"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          flexShrink: 0,
                        }}
                      >
                        {installment.category?.icon || "📅"}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {installment.description.replace(/\(Cuota.*?\)/g, "").trim()}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            color: "var(--color-text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          <span>{formatDate(installment.date)}</span>
                          <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--color-text-muted)" }} />
                          <span style={{ color: "var(--color-text-secondary)" }}>
                            Cuota {installment.installment_number} de {totalInstallments}
                          </span>
                          {isCurrentMonth && (
                            <>
                              <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "var(--color-text-muted)" }} />
                              <span
                                style={{
                                  color: "var(--color-warning)",
                                  fontWeight: 600,
                                  fontSize: "9px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                Vence este mes
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {formatCurrency(installment.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

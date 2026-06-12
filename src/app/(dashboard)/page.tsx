import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Obtener el usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Obtener fecha de inicio del mes actual en formato YYYY-MM-DD para consultar cuotas
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

  // Ejecutar todas las consultas en paralelo para máxima velocidad de carga
  const [
    profileResult,
    metricsResult,
    byCategoryResult,
    totalsResult,
    recentExpensesResult,
    installmentsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, preferred_currency").eq("id", user.id).maybeSingle(),
    supabase.from("current_month_metrics").select("*").eq("user_id", user.id),
    supabase.from("monthly_expenses_by_category").select("*").eq("user_id", user.id),
    supabase.from("monthly_totals").select("*").eq("user_id", user.id),
    supabase.from("expenses")
      .select("id, user_id, category_id, amount, description, currency, date, installment_purchase_id, installment_number, created_at, category:categories(name, icon, color)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("expenses")
      .select("id, user_id, category_id, amount, description, currency, date, installment_purchase_id, installment_number, created_at, category:categories(name, icon, color), purchase:purchases_installments(total_installments)")
      .eq("user_id", user.id)
      .not("installment_purchase_id", "is", null)
      .gte("date", startOfMonthStr)
      .order("date", { ascending: true })
      .limit(5),
  ]);

  const preferredCurrency = profileResult.data?.preferred_currency || "ARS";
  const displayName = profileResult.data?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "Usuario";
  const metrics = metricsResult.data || [];
  const expensesByCategory = byCategoryResult.data || [];
  const monthlyTotals = totalsResult.data || [];
  const recentExpenses = (recentExpensesResult.data || []) as any[];
  const upcomingInstallments = (installmentsResult.data || []) as any[];

  return (
    <DashboardPageWrapper
      preferredCurrency={preferredCurrency}
      displayName={displayName}
      metrics={metrics}
      expensesByCategory={expensesByCategory}
      monthlyTotals={monthlyTotals}
      recentExpenses={recentExpenses}
      upcomingInstallments={upcomingInstallments}
    />
  );
}

// Wrapper simple para resolver tipados
function DashboardPageWrapper({
  preferredCurrency,
  displayName,
  metrics,
  expensesByCategory,
  monthlyTotals,
  recentExpenses,
  upcomingInstallments,
}: {
  preferredCurrency: "ARS" | "USD";
  displayName: string;
  metrics: any[];
  expensesByCategory: any[];
  monthlyTotals: any[];
  recentExpenses: any[];
  upcomingInstallments: any[];
}) {
  return (
    <DashboardClient
      initialPreferredCurrency={preferredCurrency}
      displayName={displayName}
      metrics={metrics}
      expensesByCategory={expensesByCategory}
      monthlyTotals={monthlyTotals}
      recentExpenses={recentExpenses}
      upcomingInstallments={upcomingInstallments}
    />
  );
}


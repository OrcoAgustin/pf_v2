import { createClient } from "@/lib/supabase/server";
import ExpensesClient from "./ExpensesClient";
import type { ExpenseWithCategory } from "@/lib/supabase/types";

export default async function ExpensesPage() {
  const supabase = await createClient();

  // Obtener el usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Consultar en paralelo los gastos y categorías del usuario
  const [profileResult, expensesResult, categoriesResult] = await Promise.all([
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
    supabase.from("expenses")
      .select("id, user_id, category_id, amount, description, currency, date, installment_purchase_id, installment_number, created_at, category:categories(id, name, icon, color)")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("categories")
      .select("*")
      .order("name", { ascending: true }),
  ]);

  const preferredCurrency = profileResult.data?.preferred_currency || "ARS";
  // Forzar type cast ya que Supabase infiere la unión de relaciones de forma genérica
  const initialExpenses = (expensesResult.data || []) as unknown as ExpenseWithCategory[];
  const categories = categoriesResult.data || [];

  return (
    <ExpensesClient
      initialPreferredCurrency={preferredCurrency}
      initialExpenses={initialExpenses}
      categories={categories}
    />
  );
}

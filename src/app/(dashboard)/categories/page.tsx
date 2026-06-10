import { createClient } from "@/lib/supabase/server";
import CategoriesClient from "./CategoriesClient";
import type { Category } from "@/lib/supabase/types";

export type CategoryWithUsage = Category & {
  expensesCount: number;
  installmentsCount: number;
};

export default async function CategoriesPage() {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Consultar en paralelo: perfil, categorías, gastos e installments
  const [profileResult, categoriesResult, expensesResult, installmentsResult] = await Promise.all([
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
    supabase.from("categories")
      .select("*")
      .order("name", { ascending: true }),
    supabase.from("expenses")
      .select("category_id")
      .eq("user_id", user.id),
    supabase.from("purchases_installments")
      .select("category_id")
      .eq("user_id", user.id),
  ]);

  const preferredCurrency = profileResult.data?.preferred_currency || "ARS";
  const rawCategories = categoriesResult.data || [];
  const rawExpenses = expensesResult.data || [];
  const rawInstallments = installmentsResult.data || [];

  // Calcular las frecuencias de uso para cada categoría
  const expensesCountMap: Record<string, number> = {};
  const installmentsCountMap: Record<string, number> = {};

  rawExpenses.forEach((item) => {
    if (item.category_id) {
      expensesCountMap[item.category_id] = (expensesCountMap[item.category_id] || 0) + 1;
    }
  });

  rawInstallments.forEach((item) => {
    if (item.category_id) {
      installmentsCountMap[item.category_id] = (installmentsCountMap[item.category_id] || 0) + 1;
    }
  });

  // Mapear categorías con sus contadores de uso
  const categoriesWithUsage: CategoryWithUsage[] = rawCategories.map((cat) => ({
    ...cat,
    expensesCount: expensesCountMap[cat.id] || 0,
    installmentsCount: installmentsCountMap[cat.id] || 0,
  }));

  return (
    <CategoriesClient
      initialPreferredCurrency={preferredCurrency}
      categories={categoriesWithUsage}
    />
  );
}

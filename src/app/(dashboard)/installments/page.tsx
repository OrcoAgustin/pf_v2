import { createClient } from "@/lib/supabase/server";
import InstallmentsClient from "./InstallmentsClient";
import type { PurchaseInstallment, Category, Expense } from "@/lib/supabase/types";

export type PurchaseInstallmentWithCategory = PurchaseInstallment & {
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
};

export default async function InstallmentsPage() {
  const supabase = await createClient();

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Consultar datos necesarios en paralelo
  const [profileResult, categoriesResult, purchasesResult, expensesResult] = await Promise.all([
    supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
    supabase.from("categories").select("*").order("name", { ascending: true }),
    supabase.from("purchases_installments")
      .select("*, category:categories(id, name, icon, color)")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("expenses")
      .select("id, amount, date, installment_purchase_id, installment_number")
      .eq("user_id", user.id)
      .not("installment_purchase_id", "is", null),
  ]);

  const preferredCurrency = profileResult.data?.preferred_currency || "ARS";
  const categories = categoriesResult.data || [];
  
  // Forzar type cast
  const initialPurchases = (purchasesResult.data || []) as unknown as PurchaseInstallmentWithCategory[];
  const installmentExpenses = (expensesResult.data || []) as unknown as Pick<Expense, "id" | "amount" | "date" | "installment_purchase_id" | "installment_number">[];

  return (
    <InstallmentsClient
      initialPreferredCurrency={preferredCurrency}
      categories={categories}
      initialPurchases={initialPurchases}
      installmentExpenses={installmentExpenses}
    />
  );
}

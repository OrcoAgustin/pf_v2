// =============================================================================
// Tipos TypeScript para las tablas de Supabase
// Basados en el schema.sql del proyecto
// =============================================================================

export type Profile = {
  id: string
  email: string
  display_name: string | null
  preferred_currency: 'ARS' | 'USD'
  created_at: string
}

export type Category = {
  id: string
  name: string
  icon: string
  color: string
  user_id: string | null
  created_at: string
}

export type PurchaseInstallment = {
  id: string
  user_id: string
  description: string
  total_amount: number
  total_installments: number
  interest_rate: number
  currency: 'ARS' | 'USD'
  start_date: string
  category_id: string | null
  created_at: string
}

export type Expense = {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  description: string
  currency: 'ARS' | 'USD'
  date: string
  installment_purchase_id: string | null
  installment_number: number | null
  created_at: string
}

// Tipos para las vistas
export type MonthlyExpenseByCategory = {
  user_id: string
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  currency: 'ARS' | 'USD'
  total_amount: number
  transaction_count: number
  month: string
}

export type MonthlyTotal = {
  user_id: string
  currency: 'ARS' | 'USD'
  month: string
  total_amount: number
  transaction_count: number
}

export type CurrentMonthMetrics = {
  user_id: string
  currency: 'ARS' | 'USD'
  total_month: number
  daily_average: number
  future_installments_total: number
}

// Tipo para el expense con la categoría joinada
export type ExpenseWithCategory = Expense & {
  category: Pick<Category, 'name' | 'icon' | 'color'> | null
}

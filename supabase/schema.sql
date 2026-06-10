-- ============================================================================
-- SCHEMA SQL - App de Finanzas Personales
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLA: profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  preferred_currency TEXT NOT NULL DEFAULT 'ARS' CHECK (preferred_currency IN ('ARS', 'USD')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- 2. TABLA: categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#94A3B8',
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categorías globales (user_id IS NULL) visibles para todos los autenticados
CREATE POLICY "Anyone can view global categories"
  ON categories FOR SELECT
  USING (user_id IS NULL);

-- Categorías custom del usuario
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TABLA: purchases_installments (Compras en cuotas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchases_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  total_installments INTEGER NOT NULL CHECK (total_installments > 0),
  interest_rate NUMERIC NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
  currency TEXT NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS para purchases_installments
ALTER TABLE purchases_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own installment purchases"
  ON purchases_installments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installment purchases"
  ON purchases_installments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installment purchases"
  ON purchases_installments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own installment purchases"
  ON purchases_installments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TABLA: expenses (Gastos / Cuotas individuales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  installment_purchase_id UUID REFERENCES purchases_installments(id) ON DELETE CASCADE,
  installment_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Si tiene installment_purchase_id, debe tener installment_number
  CONSTRAINT installment_consistency CHECK (
    (installment_purchase_id IS NULL AND installment_number IS NULL) OR
    (installment_purchase_id IS NOT NULL AND installment_number IS NOT NULL AND installment_number > 0)
  )
);

-- Índices para optimizar queries del dashboard
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_installment ON expenses(installment_purchase_id);

-- RLS para expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. FUNCIÓN: Generar cuotas automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_installment_expenses(
  p_purchase_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_purchase RECORD;
  v_installment_amount NUMERIC;
  v_current_date DATE;
  i INTEGER;
BEGIN
  -- Obtener datos de la compra
  SELECT * INTO v_purchase
  FROM purchases_installments
  WHERE id = p_purchase_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found or not authorized';
  END IF;

  -- Calcular monto por cuota (sin interés, interés es informativo)
  v_installment_amount := ROUND(v_purchase.total_amount / v_purchase.total_installments, 2);

  -- Generar una cuota por cada mes
  FOR i IN 1..v_purchase.total_installments LOOP
    v_current_date := v_purchase.start_date + ((i - 1) * INTERVAL '1 month');

    INSERT INTO expenses (
      user_id,
      category_id,
      amount,
      description,
      currency,
      date,
      installment_purchase_id,
      installment_number
    ) VALUES (
      v_purchase.user_id,
      v_purchase.category_id,
      v_installment_amount,
      v_purchase.description || ' (Cuota ' || i || '/' || v_purchase.total_installments || ')',
      v_purchase.currency,
      v_current_date,
      v_purchase.id,
      i
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. VISTAS para Dashboard (agregaciones en PostgreSQL)
-- ============================================================================

-- Vista: Gastos del mes actual por categoría
CREATE OR REPLACE VIEW monthly_expenses_by_category AS
SELECT
  e.user_id,
  c.id AS category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  e.currency,
  SUM(e.amount) AS total_amount,
  COUNT(*) AS transaction_count,
  DATE_TRUNC('month', e.date) AS month
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
WHERE e.date >= DATE_TRUNC('month', CURRENT_DATE)
  AND e.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY e.user_id, c.id, c.name, c.icon, c.color, e.currency, DATE_TRUNC('month', e.date);

-- Vista: Totales mensuales (últimos 12 meses)
CREATE OR REPLACE VIEW monthly_totals AS
SELECT
  e.user_id,
  e.currency,
  DATE_TRUNC('month', e.date) AS month,
  SUM(e.amount) AS total_amount,
  COUNT(*) AS transaction_count
FROM expenses e
WHERE e.date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
GROUP BY e.user_id, e.currency, DATE_TRUNC('month', e.date)
ORDER BY month;

-- Vista: Métricas del mes actual
CREATE OR REPLACE VIEW current_month_metrics AS
SELECT
  e.user_id,
  e.currency,
  SUM(e.amount) AS total_month,
  ROUND(SUM(e.amount) / GREATEST(EXTRACT(DAY FROM CURRENT_DATE), 1), 2) AS daily_average,
  (
    SELECT COALESCE(SUM(ex.amount), 0)
    FROM expenses ex
    WHERE ex.user_id = e.user_id
      AND ex.currency = e.currency
      AND ex.installment_purchase_id IS NOT NULL
      AND ex.date > CURRENT_DATE
  ) AS future_installments_total
FROM expenses e
WHERE e.date >= DATE_TRUNC('month', CURRENT_DATE)
  AND e.date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY e.user_id, e.currency;

-- ============================================================================
-- RLS en las vistas (las vistas heredan RLS de las tablas base)
-- No es necesario agregar RLS adicional
-- ============================================================================

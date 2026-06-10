-- ============================================================================
-- SEED SQL - Datos Iniciales
-- Ejecutar después de schema.sql en el SQL Editor de Supabase
-- ============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Ejecutar primero schema.sql en el SQL Editor de Supabase
-- 2. Luego ejecutar este archivo (seed.sql)
-- 3. La Sección 1 (categorías globales) se ejecuta directamente
-- 4. La Sección 2 (datos de ejemplo) está COMENTADA porque necesita un
--    user_id real. Para usarla:
--    a. Registrate en la app
--    b. Buscá tu user_id en Authentication > Users en Supabase Dashboard
--    c. Reemplazá 'TU_USER_ID_AQUI' por tu UUID real
--    d. Descomentá y ejecutá
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: Categorías globales (user_id = NULL, visibles para todos)
-- ============================================================================
INSERT INTO categories (name, icon, color, user_id) VALUES
  ('Comida',       '🍔', '#FF6B6B', NULL),
  ('Transporte',   '🚗', '#4ECDC4', NULL),
  ('Servicios',    '💡', '#FFE66D', NULL),
  ('Ocio',         '🎮', '#A855F7', NULL),
  ('Salud',        '🏥', '#22D3EE', NULL),
  ('Educación',    '📚', '#3B82F6', NULL),
  ('Hogar',        '🏠', '#F97316', NULL),
  ('Ropa',         '👕', '#EC4899', NULL),
  ('Otros',        '📦', '#94A3B8', NULL),
  ('Suscripciones','🔄', '#6366F1', NULL),
  ('Mascotas',     '🐾', '#D946EF', NULL),
  ('Ahorro',       '💰', '#10B981', NULL);

-- ============================================================================
-- SECCIÓN 2: Datos de ejemplo para testing (COMENTADO)
-- Descomentá reemplazando 'TU_USER_ID_AQUI' con tu UUID real
-- ============================================================================

-- -- Paso 1: Obtener IDs de categorías para referencia
-- -- (los UUIDs se generan automáticamente, usamos subconsultas)

-- -- Gastos simples del mes actual
-- INSERT INTO expenses (user_id, category_id, amount, description, currency, date) VALUES
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Comida' AND user_id IS NULL LIMIT 1),
--    2500, 'Almuerzo McDonald''s', 'ARS', CURRENT_DATE),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Comida' AND user_id IS NULL LIMIT 1),
--    8500, 'Supermercado semanal', 'ARS', CURRENT_DATE - INTERVAL '2 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Transporte' AND user_id IS NULL LIMIT 1),
--    1200, 'SUBE recarga', 'ARS', CURRENT_DATE - INTERVAL '3 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Transporte' AND user_id IS NULL LIMIT 1),
--    3500, 'Uber al centro', 'ARS', CURRENT_DATE - INTERVAL '5 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Servicios' AND user_id IS NULL LIMIT 1),
--    12000, 'Factura de luz', 'ARS', CURRENT_DATE - INTERVAL '7 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Servicios' AND user_id IS NULL LIMIT 1),
--    8900, 'Internet Fibertel', 'ARS', CURRENT_DATE - INTERVAL '10 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Ocio' AND user_id IS NULL LIMIT 1),
--    4500, 'Netflix', 'ARS', CURRENT_DATE - INTERVAL '1 day'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Ocio' AND user_id IS NULL LIMIT 1),
--    6000, 'Cine + pochoclos', 'ARS', CURRENT_DATE - INTERVAL '4 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Salud' AND user_id IS NULL LIMIT 1),
--    15000, 'Farmacia', 'ARS', CURRENT_DATE - INTERVAL '6 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Ropa' AND user_id IS NULL LIMIT 1),
--    25000, 'Zapatillas Nike', 'ARS', CURRENT_DATE - INTERVAL '8 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Suscripciones' AND user_id IS NULL LIMIT 1),
--    3200, 'Spotify Premium', 'ARS', CURRENT_DATE - INTERVAL '12 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Mascotas' AND user_id IS NULL LIMIT 1),
--    7800, 'Alimento para perro', 'ARS', CURRENT_DATE - INTERVAL '9 days');

-- -- Gastos en USD
-- INSERT INTO expenses (user_id, category_id, amount, description, currency, date) VALUES
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Suscripciones' AND user_id IS NULL LIMIT 1),
--    12.99, 'ChatGPT Plus', 'USD', CURRENT_DATE - INTERVAL '5 days'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Educación' AND user_id IS NULL LIMIT 1),
--    29.99, 'Curso Udemy', 'USD', CURRENT_DATE - INTERVAL '15 days');

-- -- Ejemplo de compra en cuotas: Celular
-- INSERT INTO purchases_installments (user_id, description, total_amount, total_installments, interest_rate, currency, start_date, category_id) VALUES
--   ('TU_USER_ID_AQUI', 'Samsung Galaxy S24', 600000, 12, 0, 'ARS', CURRENT_DATE - INTERVAL '2 months',
--    (SELECT id FROM categories WHERE name = 'Otros' AND user_id IS NULL LIMIT 1));
-- -- NOTA: Después de insertar la compra, llamar a la función para generar las cuotas:
-- -- SELECT generate_installment_expenses('UUID_DE_LA_COMPRA_INSERTADA');

-- -- Ejemplo de compra en cuotas: Notebook
-- INSERT INTO purchases_installments (user_id, description, total_amount, total_installments, interest_rate, currency, start_date, category_id) VALUES
--   ('TU_USER_ID_AQUI', 'Notebook Lenovo ThinkPad', 950000, 18, 0, 'ARS', CURRENT_DATE - INTERVAL '1 month',
--    (SELECT id FROM categories WHERE name = 'Otros' AND user_id IS NULL LIMIT 1));
-- -- SELECT generate_installment_expenses('UUID_DE_LA_COMPRA_INSERTADA');

-- -- Gastos del mes anterior (para que se vea la tendencia en el dashboard)
-- INSERT INTO expenses (user_id, category_id, amount, description, currency, date) VALUES
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Comida' AND user_id IS NULL LIMIT 1),
--    35000, 'Supermercado mensual', 'ARS', CURRENT_DATE - INTERVAL '1 month'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Transporte' AND user_id IS NULL LIMIT 1),
--    8000, 'Nafta', 'ARS', CURRENT_DATE - INTERVAL '1 month'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Servicios' AND user_id IS NULL LIMIT 1),
--    22000, 'Servicios varios', 'ARS', CURRENT_DATE - INTERVAL '1 month'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Ocio' AND user_id IS NULL LIMIT 1),
--    15000, 'Salidas del mes', 'ARS', CURRENT_DATE - INTERVAL '1 month');

-- -- Gastos de hace 2 meses
-- INSERT INTO expenses (user_id, category_id, amount, description, currency, date) VALUES
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Comida' AND user_id IS NULL LIMIT 1),
--    32000, 'Supermercado mensual', 'ARS', CURRENT_DATE - INTERVAL '2 months'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Transporte' AND user_id IS NULL LIMIT 1),
--    7500, 'Nafta', 'ARS', CURRENT_DATE - INTERVAL '2 months'),
--   ('TU_USER_ID_AQUI', (SELECT id FROM categories WHERE name = 'Servicios' AND user_id IS NULL LIMIT 1),
--    20000, 'Servicios varios', 'ARS', CURRENT_DATE - INTERVAL '2 months');

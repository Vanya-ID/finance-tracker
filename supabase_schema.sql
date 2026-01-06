-- Схема базы данных для finance-tracker

-- Таблица пользователей (создается автоматически Supabase Auth)
-- Мы будем использовать auth.users для хранения пользователей

-- Таблица финансовых данных пользователя
CREATE TABLE IF NOT EXISTS user_financial_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    financial_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Таблица настроек пользователя
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Таблица отчетов за месяц
CREATE TABLE IF NOT EXISTS monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (
        month >= 1
        AND month <= 12
    ),
    plan JSONB NOT NULL,
    actual JSONB,
    created_at BIGINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, year, month)
);

-- Таблица вычетов из копилок
CREATE TABLE IF NOT EXISTS savings_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    withdrawals JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Таблица транзакций (доходы/расходы)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    date BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_financial_data_user_id ON user_financial_data (user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_id ON monthly_reports (user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_year_month ON monthly_reports (user_id, year, month);

CREATE INDEX IF NOT EXISTS idx_savings_withdrawals_user_id ON savings_withdrawals (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (user_id, date);

-- Row Level Security (RLS) политики
-- Включаем RLS для всех таблиц
ALTER TABLE user_financial_data ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE savings_withdrawals ENABLE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Политики: пользователи могут читать и писать только свои данные
DROP POLICY IF EXISTS "Users can view own financial data" ON user_financial_data;

CREATE POLICY "Users can view own financial data" ON user_financial_data FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own financial data" ON user_financial_data;

CREATE POLICY "Users can insert own financial data" ON user_financial_data FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own financial data" ON user_financial_data;

CREATE POLICY "Users can update own financial data" ON user_financial_data
FOR UPDATE
    USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;

CREATE POLICY "Users can view own settings" ON user_settings FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can update own settings" ON user_settings
FOR UPDATE
    USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

CREATE POLICY "Users can view own profile" ON user_profiles FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE
    USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can view own reports" ON monthly_reports;

CREATE POLICY "Users can view own reports" ON monthly_reports FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON monthly_reports;

CREATE POLICY "Users can insert own reports" ON monthly_reports FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own reports" ON monthly_reports;

CREATE POLICY "Users can update own reports" ON monthly_reports
FOR UPDATE
    USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can delete own reports" ON monthly_reports;

CREATE POLICY "Users can delete own reports" ON monthly_reports FOR DELETE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can view own withdrawals" ON savings_withdrawals;

CREATE POLICY "Users can view own withdrawals" ON savings_withdrawals FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own withdrawals" ON savings_withdrawals;

CREATE POLICY "Users can insert own withdrawals" ON savings_withdrawals FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own withdrawals" ON savings_withdrawals;

CREATE POLICY "Users can update own withdrawals" ON savings_withdrawals
FOR UPDATE
    USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

CREATE POLICY "Users can view own transactions" ON transactions FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;

CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

CREATE POLICY "Users can update own transactions" ON transactions
FOR UPDATE
    USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid () = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_user_financial_data_updated_at ON user_financial_data;

CREATE TRIGGER update_user_financial_data_updated_at BEFORE UPDATE ON user_financial_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_reports_updated_at ON monthly_reports;

CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_savings_withdrawals_updated_at ON savings_withdrawals;

CREATE TRIGGER update_savings_withdrawals_updated_at BEFORE UPDATE ON savings_withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
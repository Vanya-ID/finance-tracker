-- Схема базы данных для finance-tracker (offline-first синхронизация)
--
-- Приложение хранит данные локально в localStorage и синхронизирует их с этой
-- таблицей. Каждая строка — один блок данных пользователя (financial-data,
-- settings, profile), сохранённый целиком как JSON.
-- Разрешение конфликтов — last-write-wins по updated_at.
--
-- Выполнить один раз в Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS user_data (
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (user_id, key)
);

ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON user_data;

CREATE POLICY "Users can view own data" ON user_data FOR
SELECT USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can insert own data" ON user_data;

CREATE POLICY "Users can insert own data" ON user_data FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can update own data" ON user_data;

CREATE POLICY "Users can update own data" ON user_data
FOR UPDATE
    USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

DROP POLICY IF EXISTS "Users can delete own data" ON user_data;

CREATE POLICY "Users can delete own data" ON user_data FOR DELETE USING (auth.uid () = user_id);

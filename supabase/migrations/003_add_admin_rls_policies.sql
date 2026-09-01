-- ============================================================
-- Migration 003: Políticas RLS para admin
-- Execute no Supabase SQL Editor e confira "Success"
-- Idempotente: pode rodar várias vezes sem erro
-- ============================================================

-- ------------------------------------------------------------
-- ADMIN: tabela schools (permissão total)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin pode ver todas as escolas" ON schools;
CREATE POLICY "Admin pode ver todas as escolas" ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin insere escolas" ON schools;
CREATE POLICY "Admin insere escolas" ON schools
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin atualiza escolas" ON schools;
CREATE POLICY "Admin atualiza escolas" ON schools
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin remove escolas" ON schools;
CREATE POLICY "Admin remove escolas" ON schools
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ------------------------------------------------------------
-- ADMIN: tabela students (permissão total)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin vê todos os alunos" ON students;
CREATE POLICY "Admin vê todos os alunos" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin insere alunos" ON students;
CREATE POLICY "Admin insere alunos" ON students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin atualiza alunos" ON students;
CREATE POLICY "Admin atualiza alunos" ON students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin remove alunos" ON students;
CREATE POLICY "Admin remove alunos" ON students
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ------------------------------------------------------------
-- ADMIN: tabela school_users (permissão total, se não existir)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin gerencia school_users" ON school_users;
CREATE POLICY "Admin gerencia school_users" ON school_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ------------------------------------------------------------
-- ---------------- ESCOLAS (não-admin) ----------------------
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Escola vê sua própria escola" ON schools;
CREATE POLICY "Escola vê sua própria escola" ON schools
  FOR SELECT USING (
    id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- ---------------- STUDENTS (escolas) ------------------------
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Escola vê seus alunos" ON students;
CREATE POLICY "Escola vê seus alunos" ON students
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Escola gerencia seus alunos" ON students;
CREATE POLICY "Escola gerencia seus alunos" ON students
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Escola atualiza seus alunos" ON students;
CREATE POLICY "Escola atualiza seus alunos" ON students
  FOR UPDATE USING (
    school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- ---------------- ABSENCES -----------------------------------
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin vê todas as faltas" ON absences;
CREATE POLICY "Admin vê todas as faltas" ON absences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Escola vê suas faltas" ON absences;
CREATE POLICY "Escola vê suas faltas" ON absences
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Escola insere faltas" ON absences;
CREATE POLICY "Escola insere faltas" ON absences
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM school_users WHERE user_id = auth.uid())
    AND student_id IN (
      SELECT id FROM students WHERE school_id IN (
        SELECT school_id FROM school_users WHERE user_id = auth.uid()
      )
    )
  );

-- ------------------------------------------------------------
-- ---------------- SCHOOL_USERS (escola) ----------------------
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Usuário vê seus vínculos" ON school_users;
CREATE POLICY "Usuário vê seus vínculos" ON school_users
  FOR SELECT USING (user_id = auth.uid());

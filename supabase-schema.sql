-- Schema for Sistema de Gestão de Faltas Escolares
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  responsible TEXT NOT NULL,
  class TEXT NOT NULL,
  phone1 TEXT NOT NULL,
  phone2 TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela absences
CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  observation TEXT,
  registered_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'REGISTRADA' CHECK (status IN ('REGISTRADA', 'ENVIADA', 'VISUALIZADA', 'CANCELADA')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela school_users (para vincular usuários do Supabase Auth às escolas)
CREATE TABLE school_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, user_id)
);

-- Índices para performance
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_active ON students(active) WHERE active = true;
CREATE INDEX idx_absences_student_id ON absences(student_id);
CREATE INDEX idx_absences_school_id ON absences(school_id);
CREATE INDEX idx_absences_absence_date ON absences(absence_date);
CREATE INDEX idx_absences_status ON absences(status);
CREATE INDEX idx_school_users_user_id ON school_users(user_id);

-- Row Level Security (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para schools
-- Admin pode ver todas as escolas
CREATE POLICY "Admin pode ver todas as escolas" ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Escola pode ver apenas sua própria escola
CREATE POLICY "Escola vê sua própria escola" ON schools
  FOR SELECT USING (
    id IN (
      SELECT school_id FROM school_users WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para students
-- Admin pode ver todos os alunos
CREATE POLICY "Admin vê todos os alunos" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Escola vê apenas seus alunos
CREATE POLICY "Escola vê seus alunos" ON students
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM school_users WHERE user_id = auth.uid()
    )
  );

-- Escola pode inserir/atualizar apenas seus alunos (se permitido)
CREATE POLICY "Escola gerencia seus alunos" ON students
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Escola atualiza seus alunos" ON students
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM school_users WHERE user_id = auth.uid()
    )
  );

-- Políticas RLS para absences
-- Admin vê todas as faltas
CREATE POLICY "Admin vê todas as faltas" ON absences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Escola vê apenas suas faltas
CREATE POLICY "Escola vê suas faltas" ON absences
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM school_users WHERE user_id = auth.uid()
    )
  );

-- Escola pode inserir faltas para seus alunos
CREATE POLICY "Escola insere faltas" ON absences
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_users WHERE user_id = auth.uid()
    )
    AND student_id IN (
      SELECT id FROM students WHERE school_id IN (
        SELECT school_id FROM school_users WHERE user_id = auth.uid()
      )
    )
  );

-- Políticas RLS para school_users
-- Admin gerencia todos os vínculos
CREATE POLICY "Admin gerencia school_users" ON school_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Usuário vê apenas seus vínculos
CREATE POLICY "Usuário vê seus vínculos" ON school_users
  FOR SELECT USING (user_id = auth.uid());

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_absences_updated_at BEFORE UPDATE ON absences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir as 19 escolas iniciais
INSERT INTO schools (name, code, password_hash, active) VALUES
('CEI LUIZ FELIPE', 'CEI-LUIZ-FELIPE', crypt('123', gen_salt('bf')), true),
('CEM SAO CRISTOVAO', 'CEM-SAO-CRISTOVAO', crypt('123', gen_salt('bf')), true),
('CEI ARCO IRIS', 'CEI-ARCO-IRIS', crypt('123', gen_salt('bf')), true),
('CEI BRUNO LEONARDO', 'CEI-BRUNO-LEONARDO', crypt('123', gen_salt('bf')), true),
('CEI DOM FRANCO', 'CEI-DOM-FRANCO', crypt('123', gen_salt('bf')), true),
('CEI MENINO JESUS', 'CEI-MENINO-JESUS', crypt('123', gen_salt('bf')), true),
('CEI NOSSO LAR', 'CEI-NOSSO-LAR', crypt('123', gen_salt('bf')), true),
('CEI VASCO PAPA', 'CEI-VASCO-PAPA', crypt('123', gen_salt('bf')), true),
('CEI CRIANÇA FELIZ', 'CEI-CRIANCA-FELIZ', crypt('123', gen_salt('bf')), true),
('CEM GUILHERME', 'CEM-GUILHERME', crypt('123', gen_salt('bf')), true),
('CEM ORLANDO PEREIRA', 'CEM-ORLANDO-PEREIRA', crypt('123', gen_salt('bf')), true),
('EM MARIA HILDA', 'EM-MARIA-HILDA', crypt('123', gen_salt('bf')), true),
('EM PAULO FREIRE', 'EM-PAULO-FREIRE', crypt('123', gen_salt('bf')), true),
('EM JOSE ANCHIETA', 'EM-JOSE-ANCHIETA', crypt('123', gen_salt('bf')), true),
('ERM ALVARES AZEVEDO', 'ERM-ALVARES-AZEVEDO', crypt('123', gen_salt('bf')), true),
('ERM CORA CORALINA', 'ERM-CORA-CORALINA', crypt('123', gen_salt('bf')), true),
('ERM EUCLIDES CUNHA', 'ERM-EUCLIDES-CUNHA', crypt('123', gen_salt('bf')), true),
('ERM OSVALDO CRUZ', 'ERM-OSVALDO-CRUZ', crypt('123', gen_salt('bf')), true),
('ERM VINICIUS DE MORAIS', 'ERM-VINICIUS-DE-MORAIS', crypt('123', gen_salt('bf')), true);

-- Criar usuário admin no Supabase Auth (executar separadamente no dashboard do Supabase)
-- Email: admin@sistema.com
-- Senha: admin123
-- Raw user meta data: {"role": "admin"}

-- Criar usuários para cada escola no Supabase Auth (executar separadamente)
-- Email: escola-{code}@sistema.com
-- Senha: 123
-- Raw user meta data: {"role": "school", "school_id": "<school_id>"}
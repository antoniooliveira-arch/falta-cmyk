-- ============================================================
-- Seed: 19 escolas iniciais
-- ============================================================
insert into escolas (nome, codigo, ativo) values
  ('CEI LUIZ FELIPE',            'ESC-01', true),
  ('CEM SAO CRISTOVAO',          'ESC-02', true),
  ('CEI ARCO IRIS',              'ESC-03', true),
  ('CEI BRUNO LEONARDO',         'ESC-04', true),
  ('CEI DOM FRANCO',             'ESC-05', true),
  ('CEI MENINO JESUS',           'ESC-06', true),
  ('CEI NOSSO LAR',              'ESC-07', true),
  ('CEI VASCO PAPA',             'ESC-08', true),
  ('CEI CRIANÇA FELIZ',          'ESC-09', true),
  ('CEM GUILHERME',              'ESC-10', true),
  ('CEM ORLANDO PEREIRA',        'ESC-11', true),
  ('EM MARIA HILDA',             'ESC-12', true),
  ('EM PAULO FREIRE',            'ESC-13', true),
  ('EM JOSE ANCHIETA',           'ESC-14', true),
  ('ERM ALVARES AZEVEDO',        'ESC-15', true),
  ('ERM CORA CORALINA',          'ESC-16', true),
  ('ERM EUCLIDES CUNHA',         'ESC-17', true),
  ('ERM OSVALDO CRUZ',           'ESC-18', true),
  ('ERM VINICIUS DE MORAIS',     'ESC-19', true)
on conflict (codigo) do update
  set nome = excluded.nome,
      ativo = excluded.ativo;

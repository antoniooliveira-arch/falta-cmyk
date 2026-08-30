# Sistema de Gestão de Faltas Escolares

Sistema web para gerenciamento de faltas de alunos, permitindo que escolas registrem faltas e administradores tenham visão consolidada.

## Stack Tecnológica

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend/Banco**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Deploy**: Vercel
- **Versionamento**: GitHub

## Funcionalidades

### 🏫 Para Escolas
- Login com seleção de escola e senha
- Dashboard com estatísticas (alunos, faltas hoje, faltas enviadas)
- Visualização de alunos da própria escola
- Registro de faltas com data e observação
- Histórico de faltas enviadas
- Isolamento total de dados (RLS)

### 👨‍💼 Para Administradores
- Login administrativo
- Dashboard com indicadores gerais
- Gestão de escolas (CRUD)
- Gestão de alunos (CRUD + importação PDF)
- Visualização de todas as faltas com filtros avançados
- Importação de alunos via PDF com extração automática
- Gestão de usuários
- Configurações do sistema

## Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a URL e a chave anon (anon key) do projeto
3. No SQL Editor, execute o script `supabase-schema.sql`

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 3. Criar Usuários no Supabase Auth

No painel do Supabase > Authentication > Users:

**Usuário Admin:**
- Email: `admin@sistema.com`
- Senha: `admin123`
- User Metadata: `{"role": "admin"}`

**Usuários das Escolas** (para cada uma das 19 escolas):
- Email: `escola-{codigo}@sistema.com` (ex: `escola-cei-luiz-felipe@sistema.com`)
- Senha: `123`
- User Metadata: `{"role": "school", "school_id": "<uuid_da_escola>"}`

### 4. Configurar Storage (para PDFs)

No Supabase > Storage:
1. Crie um bucket chamado `pdfs`
2. Torne-o público ou configure políticas de acesso

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`

## Deploy na Vercel

1. Conecte o repositório GitHub à Vercel
2. Configure as variáveis de ambiente na Vercel
3. Deploy automático a cada push na main

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/           # Páginas de login
│   │   ├── login/        # Login da escola
│   │   └── admin-login/  # Login do admin
│   ├── (escola)/         # Área da escola (protegida por RLS)
│   │   ├── dashboard/
│   │   ├── alunos/
│   │   ├── faltas/
│   │   └── faltas-enviadas/
│   └── (admin)/          # Área administrativa
│       ├── dashboard/
│       ├── escolas/
│       ├── alunos/
│       ├── faltas/
│       ├── importar-pdf/
│       ├── usuarios/
│       └── configuracoes/
├── components/
│   └── ui/               # Componentes UI reutilizáveis
├── lib/
│   ├── auth-context.tsx  # Contexto de autenticação
│   ├── pdf-parser.ts     # Parser de PDF
│   ├── supabase/         # Clients do Supabase
│   ├── utils.ts          # Utilitários
│   └── schema-sql.ts     # Schema SQL para export
├── types/
│   └── database.ts       # Tipos TypeScript
└── middleware.ts         # Middleware de autenticação
```

## Segurança

- **RLS (Row Level Security)**: Implementado em todas as tabelas
- **Isolamento de dados**: Escolas só acessam seus próprios dados
- **Senhas**: Armazenadas com hash bcrypt via Supabase Auth
- **Autenticação**: Supabase Auth com JWT
- **Middleware**: Proteção de rotas no servidor

## Importação de PDF

O sistema suporta PDFs textuais com formato tabular:

```
NOME             RESPONSÁVEL       TURMA    FONE 1       FONE 2
João da Silva    Maria da Silva     3A       99999-1111   99999-2222
Ana Souza        Carlos Souza       3A       99999-3333   99999-4444
```

Funcionalidades:
- Extração automática de campos
- Tela de conferência antes da importação
- Detecção de duplicatas
- Marcação de registros que precisam revisão

## Escolas Iniciais (19)

1. CEI LUIZ FELIPE
2. CEM SAO CRISTOVAO
3. CEI ARCO IRIS
4. CEI BRUNO LEONARDO
5. CEI DOM FRANCO
6. CEI MENINO JESUS
7. CEI NOSSO LAR
8. CEI VASCO PAPA
9. CEI CRIANÇA FELIZ
10. CEM GUILHERME
11. CEM ORLANDO PEREIRA
12. EM MARIA HILDA
13. EM PAULO FREIRE
14. EM JOSE ANCHIETA
15. ERM ALVARES AZEVEDO
16. ERM CORA CORALINA
17. ERM EUCLIDES CUNHA
18. ERM OSVALDO CRUZ
19. ERM VINICIUS DE MORAIS

## Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run start    # Iniciar produção
npm run lint     # Linting
```

## Licença

Projeto privado para uso educacional.
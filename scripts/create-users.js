const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Ler .env.local manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado')
    process.exit(1)
  }
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  content.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length) {
      env[key.trim()] = rest.join('=').trim()
    }
  })
  return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createUsers() {
  console.log('🔍 Buscando escolas no banco...')
  
  const { data: dbSchools, error: schoolsError } = await supabase
    .from('schools')
    .select('id, code, name')
    .eq('active', true)
    .order('name')

  if (schoolsError) {
    console.error('❌ Erro ao buscar escolas:', schoolsError.message)
    return
  }

  console.log(`✅ ${dbSchools.length} escolas encontradas`)

  // 1. Criar admin
  console.log('\n👤 Criando administrador...')
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: 'admin@sistema.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { role: 'admin' }
  })

  if (adminError) {
    if (adminError.message.includes('already registered') || adminError.message.includes('already exists')) {
      console.log('ℹ️ Admin já existe')
    } else {
      console.error('❌ Erro ao criar admin:', adminError.message)
    }
  } else {
    console.log('✅ Admin criado:', adminData.user.email)
  }

  // 2. Criar usuários das escolas
  console.log('\n🏫 Criando usuários das escolas...')
  
  for (const school of dbSchools) {
    const email = `escola-${school.code.toLowerCase()}@sistema.com`
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: '123',
      email_confirm: true,
      user_metadata: { role: 'school', school_id: school.id }
    })

    if (userError) {
      if (userError.message.includes('already registered') || userError.message.includes('already exists')) {
        console.log(`ℹ️ ${school.name} já existe`)
      } else {
        console.error(`❌ Erro ao criar ${school.name}:`, userError.message)
      }
    } else {
      console.log(`✅ ${school.name} (${email})`)
      
      // Vincular na tabela school_users
      const { error: linkError } = await supabase
        .from('school_users')
        .upsert({ school_id: school.id, user_id: userData.user.id })
      
      if (linkError) {
        console.error(`⚠️ Erro ao vincular ${school.name}:`, linkError.message)
      }
    }
  }

  // 3. Verificar vínculos
  console.log('\n🔗 Verificando vínculos school_users...')
  const { data: links, error: linksError } = await supabase
    .from('school_users')
    .select('school_id, user_id, schools(name), users(email)')

  if (!linksError) {
    console.log(`✅ ${links.length} vínculos criados`)
    links.forEach(l => console.log(`   - ${l.schools?.name}: ${l.users?.email}`))
  }

  console.log('\n🎉 Concluído!')
  console.log('\n📋 Credenciais:')
  console.log('   Admin: admin@sistema.com / admin123')
  console.log('   Escolas: escola-{codigo}@sistema.com / 123')
}

createUsers().catch(console.error)
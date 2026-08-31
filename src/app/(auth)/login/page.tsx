'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { School } from '@/types/database'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, loading: authLoading } = useAuth()
  const [schoolId, setSchoolId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)

  useEffect(() => {
    fetchSchools()
  }, [])

  const supabase = createClient()

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setSchools(data || [])
    } catch (err) {
      console.error('Error fetching schools:', err)
    } finally {
      setSchoolsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!schoolId) {
      setError('Selecione uma escola')
      setLoading(false)
      return
    }

    if (!password) {
      setError('Informe a senha')
      setLoading(false)
      return
    }

    const selectedSchool = schools.find(s => s.id === schoolId)
    if (!selectedSchool) {
      setError('Escola não encontrada')
      setLoading(false)
      return
    }

    const email = `escola-${selectedSchool.code.toLowerCase()}@sistema.com`

    const { error } = await signIn(email, password)

    if (error) {
      setError('Senha incorreta. Tente novamente.')
    } else {
      router.push('/escola/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="text-center mb-6 bg-card border-b border-border">
        <img src="/globe.svg" alt="Ícone do Sistema" className="h-6 w-auto mb-2" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema de Gestão de Faltas</CardTitle>
          <CardDescription>Faça login para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school">Escola</Label>
              <Select
                id="school"
                value={schoolId}
                onValueChange={setSchoolId}
                disabled={schoolsLoading}
                required
              >
                <option value="">Selecione a escola</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Digite a senha"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || authLoading}>
              {loading ? 'Entrando...' : 'ENTRAR'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Senha inicial para todas as escolas: <strong>123</strong>
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              <a href="/admin-login" className="text-primary hover:underline">
                Acesso Administrativo
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
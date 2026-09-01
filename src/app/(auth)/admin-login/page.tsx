'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLoginPage() {
  const router = useRouter()
  const { signIn, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('admin@sistema.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Preencha todos os campos')
      setLoading(false)
      return
    }

    const { error } = await signIn(email, password)

    if (error) {
      setError('Credenciais inválidas. Tente novamente.')
    } else {
      router.push('/admin/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 p-4">
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-slate-200/30 blur-2xl" />
      <div className="absolute bottom-1/3 right-1/4 h-72 w-72 rounded-full bg-violet-200/40 blur-2xl" />
      <Card className="relative w-full max-w-md shadow-2xl border-0 border-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
            Acesso Administrativo
          </CardTitle>
          <CardDescription>Login do administrador do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Usuário</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="admin@sistema.com"
              />
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
              <a href="/login" className="text-primary hover:underline">
                Voltar para login da escola
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
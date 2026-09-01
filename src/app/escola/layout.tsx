'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  History,
  LogOut,
  BookOpen,
  Send,
  Clock
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/escola/dashboard', icon: LayoutDashboard },
  { name: 'Alunos', href: '/escola/alunos', icon: Users },
  { name: 'Registrar Faltas', href: '/escola/faltas', icon: ClipboardList },
  { name: 'Faltas Enviadas', href: '/escola/faltas-enviadas', icon: History },
]

export default function EscolaLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [stats, setStats] = useState({ students: 0, absencesToday: 0, absencesSent: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const supabase = createClient()

  const fetchStats = async () => {
    if (!user?.school_id) return
    try {
      const [studentsRes, absencesTodayRes, absencesSentRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('active', true),
        supabase.from('absences').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('absence_date', new Date().toISOString().split('T')[0]),
        supabase.from('absences').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('status', 'ENVIADA')
      ])

      setStats({
        students: studentsRes.count || 0,
        absencesToday: absencesTodayRes.count || 0,
        absencesSent: absencesSentRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    if (user) {
      fetchStats()
    }
  }, [user, loading])

  useEffect(() => {
    if (user) fetchStats()
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/escola/dashboard" className="font-bold text-xl text-primary">
              Sistema de Faltas
            </Link>
            <span className="text-sm font-semibold text-primary">{user.school_name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-xs">
              {user.role === 'admin' ? 'Administrador' : 'Escola'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6" aria-label="Main navigation">
          <ul className="flex flex-wrap gap-2">
            {navigation.map(item => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {pathname === '/escola/dashboard' && !statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alunos Cadastrados</p>
                    <p className="text-3xl font-bold">{stats.students}</p>
                  </div>
                  <Users className="h-12 w-12 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Faltas Registradas Hoje</p>
                    <p className="text-3xl font-bold text-warning">{stats.absencesToday}</p>
                  </div>
                  <Clock className="h-12 w-12 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Faltas Enviadas</p>
                    <p className="text-3xl font-bold text-success">{stats.absencesSent}</p>
                  </div>
                  <Send className="h-12 w-12 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Building,
  Users,
  ClipboardList,
  FileText,
  UserCog,
  Settings,
  LogOut,
  Home,
  BookOpen,
  Send,
  Clock,
  Search,
  Filter
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Escolas', href: '/admin/escolas', icon: Building },
  { name: 'Alunos', href: '/admin/alunos', icon: Users },
  { name: 'Faltas', href: '/admin/faltas', icon: ClipboardList },
  { name: 'Importar', href: '/admin/importar-pdf', icon: FileText },
  { name: 'Usuários', href: '/admin/usuarios', icon: UserCog },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [stats, setStats] = useState({ schools: 0, students: 0, absencesToday: 0, absencesMonth: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  const supabase = createClient()

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const [schoolsRes, studentsRes, absencesTodayRes, absencesMonthRes] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('absences').select('id', { count: 'exact', head: true }).eq('absence_date', today),
        supabase.from('absences').select('id', { count: 'exact', head: true }).gte('absence_date', firstDayOfMonth)
      ])

      setStats({
        schools: schoolsRes.count || 0,
        students: studentsRes.count || 0,
        absencesToday: absencesTodayRes.count || 0,
        absencesMonth: absencesMonthRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/admin-login')
    }
    if (user?.role === 'admin') {
      fetchStats()
    }
  }, [user, loading])

  useEffect(() => {
    if (user?.role === 'admin') fetchStats()
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin-login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="font-bold text-xl text-primary">
              Painel Administrativo
            </Link>
            <Badge variant="secondary" className="text-xs">Admin</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
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

        {pathname === '/admin/dashboard' && !statsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Escolas</p>
                    <p className="text-3xl font-bold">{stats.schools}</p>
                  </div>
                  <Building className="h-12 w-12 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Alunos</p>
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
                    <p className="text-sm text-muted-foreground">Faltas Hoje</p>
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
                    <p className="text-sm text-muted-foreground">Faltas no Mês</p>
                    <p className="text-3xl font-bold text-primary">{stats.absencesMonth}</p>
                  </div>
                  <BookOpen className="h-12 w-12 text-muted-foreground/30" />
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
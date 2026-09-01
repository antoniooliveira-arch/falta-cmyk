'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Building, Users, ClipboardList, FileText, UserCog, Settings, Search, Filter, Plus, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<{ name: string; responsible: string; class: string; school: string; total: number }[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  const supabase = createClient()

  const fetchAlerts = async () => {
    try {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data, error } = await supabase
        .from('absences')
        .select('student_id, students(id, name, responsible, class, schools(name))')
        .gte('absence_date', since.toISOString().split('T')[0])
        .in('status', ['ENVIADA', 'VISUALIZADA', 'REGISTRADA'])

      if (error) throw error

      const countByStudent = new Map<string, { total: number; name: string; responsible: string; class: string; school: string }>()
      ;(data || []).forEach((row: any) => {
        const student = row.students as any
        if (!student) return
        const cur = countByStudent.get(row.student_id) || {
          total: 0,
          name: student.name,
          responsible: student.responsible,
          class: student.class,
          school: student.schools?.name || '—'
        }
        cur.total += 1
        countByStudent.set(row.student_id, cur)
      })

      const alertList = Array.from(countByStudent.values())
        .filter(a => a.total >= 3)
        .sort((a, b) => b.total - a.total)
        .map(({ total, name, responsible, class: cls, school }) => ({ total, name, responsible, class: cls, school }))

      setAlerts(alertList)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setAlertsLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const actions = [
    {
      name: 'Escolas',
      description: 'Gerenciar escolas cadastradas no sistema',
      href: '/admin/escolas',
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      name: 'Alunos',
      description: 'Cadastrar, editar e gerenciar todos os alunos',
      href: '/admin/alunos',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Faltas',
      description: 'Visualizar e gerenciar todas as faltas do sistema',
      href: '/admin/faltas',
      icon: ClipboardList,
      color: 'bg-purple-500'
    },
    {
      name: 'Importar',
      description: 'Importar alunos em lote através de planilhas Excel',
      href: '/admin/importar-pdf',
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      name: 'Usuários',
      description: 'Gerenciar usuários e permissões do sistema',
      href: '/admin/usuarios',
      icon: UserCog,
      color: 'bg-pink-500'
    },
    {
      name: 'Configurações',
      description: 'Configurações gerais do sistema',
      href: '/admin/configuracoes',
      icon: Settings,
      color: 'bg-gray-500'
    }
  ]

  const quickActions = [
    { name: 'Nova Escola', href: '/admin/escolas', icon: Plus, color: 'bg-blue-500' },
    { name: 'Novo Aluno', href: '/admin/alunos', icon: Users, color: 'bg-green-500' },
    { name: 'Importar', href: '/admin/importar-pdf', icon: FileText, color: 'bg-orange-500' },
    { name: 'Ver Faltas', href: '/admin/faltas', icon: ClipboardList, color: 'bg-purple-500' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie escolas, alunos, faltas e configurações do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map(action => {
          const Icon = action.icon
          return (
            <Link key={action.name} href={action.href}>
              <Card className="h-full transition-shadow hover:shadow-lg cursor-pointer">
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <span className={`p-3 rounded-xl ${action.color} text-white mb-4`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-semibold text-lg">{action.name}</h3>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Módulos do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {actions.map(action => {
                const Icon = action.icon
                return (
                  <Link key={action.name} href={action.href} className="block">
                    <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <span className={`p-2 rounded-lg ${action.color} text-white`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <h4 className="font-medium">{action.name}</h4>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map(action => {
                const Icon = action.icon
                return (
                  <Link key={action.name} href={action.href} className="block">
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <span className={`p-2 rounded-lg ${action.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-medium">{action.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-400 bg-amber-50/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Alunos com 3 ou mais faltas (últimos 30 dias / todas as escolas)
          </CardTitle>
          <Badge variant="secondary">{alerts.length}</Badge>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Nenhum aluno atingiu 3 faltas nos últimos 30 dias.
            </p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((alert, index) => (
                <li key={index} className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">Responsável: {alert.responsible}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary">{alert.school}</Badge>
                    <Badge variant="secondary">{alert.class}</Badge>
                    <Badge className="bg-amber-500 text-white">
                      {alert.total} falta{alert.total > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatísticas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-primary">19</p>
              <p className="text-sm text-muted-foreground">Escolas Cadastradas</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-green-500">—</p>
              <p className="text-sm text-muted-foreground">Total de Alunos</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-warning">—</p>
              <p className="text-sm text-muted-foreground">Faltas Hoje</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-purple-500">—</p>
              <p className="text-sm text-muted-foreground">Faltas no Mês</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
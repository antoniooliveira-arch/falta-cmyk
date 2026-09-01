'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Users, ClipboardList, History, Send, Clock, BookOpen, AlertTriangle } from 'lucide-react'

export default function EscolaDashboardPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<{ name: string; responsible: string; class: string; total: number }[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)

  const supabase = createClient()

  const fetchAlerts = async () => {
    if (!user?.school_id) return
    try {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const { data, error } = await supabase
        .from('absences')
        .select('student_id, students(id, name, responsible, class)')
        .eq('school_id', user.school_id)
        .gte('absence_date', since.toISOString().split('T')[0])
        .in('status', ['ENVIADA', 'VISUALIZADA', 'REGISTRADA'])

      if (error) throw error

      const countByStudent = new Map<string, { total: number; name: string; responsible: string; class: string }>()
      ;(data || []).forEach((row: any) => {
        const student = row.students
        if (!student) return
        const cur = countByStudent.get(row.student_id) || {
          total: 0,
          name: student.name,
          responsible: student.responsible,
          class: student.class
        }
        cur.total += 1
        countByStudent.set(row.student_id, cur)
      })

      const alertList = Array.from(countByStudent.values())
        .filter(a => a.total >= 3)
        .sort((a, b) => b.total - a.total)
        .map(({ total, name, responsible, class: cls }) => ({ total, name, responsible, class: cls }))

      setAlerts(alertList)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setAlertsLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [user?.school_id])

  const actions = [
    {
      name: 'Registrar Faltas',
      description: 'Lançar faltas dos alunos ausentes hoje',
      href: '/escola/faltas',
      icon: ClipboardList,
      color: 'bg-blue-500',
      primary: true
    },
    {
      name: 'Alunos',
      description: 'Visualizar e gerenciar alunos da escola',
      href: '/escola/alunos',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Faltas Enviadas',
      description: 'Consultar histórico de faltas enviadas',
      href: '/escola/faltas-enviadas',
      icon: History,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-primary to-blue-500 p-6 text-primary-foreground shadow-lg">
        <p className="text-sm opacity-90">Você está logado na escola:</p>
        <h1 className="text-3xl font-bold mt-1 break-words">{user?.school_name}</h1>
        <p className="text-primary-foreground/90 mt-2">
          Gerencie as faltas dos seus alunos de forma simples e rápida.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map(action => {
          const Icon = action.icon
          return (
            <Card key={action.name} className="h-full transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={`p-2 rounded-lg ${action.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {action.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                <Link href={action.href}>
                  <Button className="w-full" variant={action.primary ? 'default' : 'outline'}>
                    Acessar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-amber-400 bg-amber-50/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Alunos com 3 ou mais faltas (últimos 30 dias)
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
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/escola/faltas">
              <Button variant="outline" className="h-24 flex flex-col gap-2">
                <ClipboardList className="h-8 w-8 mx-auto" />
                <span>Registrar Falta</span>
              </Button>
            </Link>
            <Link href="/escola/alunos">
              <Button variant="outline" className="h-24 flex flex-col gap-2">
                <Users className="h-8 w-8 mx-auto" />
                <span>Ver Alunos</span>
              </Button>
            </Link>
            <Link href="/escola/faltas-enviadas">
              <Button variant="outline" className="h-24 flex flex-col gap-2">
                <History className="h-8 w-8 mx-auto" />
                <span>Faltas Enviadas</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-24 flex flex-col gap-2" disabled>
              <BookOpen className="h-8 w-8 mx-auto" />
              <span>Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, ClipboardList, History, Send, Clock, BookOpen } from 'lucide-react'

export default function EscolaDashboardPage() {
  const { user } = useAuth()

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
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo, {user?.school_name}!</h1>
        <p className="text-muted-foreground mt-1">
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
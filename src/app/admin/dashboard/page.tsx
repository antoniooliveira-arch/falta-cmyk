'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Building, Users, ClipboardList, FileText, UserCog, Settings, Search, Filter, Plus, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
  const { user } = useAuth()

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
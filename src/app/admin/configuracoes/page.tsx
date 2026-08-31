'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Shield, Key, Database, Download, Upload, RefreshCw, Settings, AlertTriangle, CheckCircle, Upload as UploadIcon } from 'lucide-react'
import { supabaseSchema } from '@/lib/schema-sql'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const [tabs, setTabs] = useState<'geral' | 'seguranca' | 'banco' | 'backup'>('geral')
  const [importEnabled, setImportEnabled] = useState(true)
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')

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
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const handleTabChange = (tab: 'geral' | 'seguranca' | 'banco' | 'backup') => {
    setTabs(tab)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Configure as opções do sistema</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 border-b">
        {[
          { id: 'geral', label: 'Geral', icon: Settings },
          { id: 'seguranca', label: 'Segurança', icon: Shield },
          { id: 'banco', label: 'Banco de Dados', icon: Database },
          { id: 'backup', label: 'Backup', icon: Download }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={tabs === tab.id ? 'default' : 'ghost'}
            onClick={() => handleTabChange(tab.id as 'geral' | 'seguranca' | 'banco' | 'backup')}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {tabs === 'geral' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>Dados gerais sobre a instalação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Versão</p>
                  <p className="font-medium text-lg">1.0.0</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Ambiente</p>
                  <p className="font-medium text-lg">Produção</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Deploy</p>
                  <p className="font-medium text-lg">Vercel</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Faltas</CardTitle>
              <CardDescription>Regras para registro de faltas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Permitir alterar data da falta</Label>
                  <Select defaultValue="true">
                    <option value="true">Sim - Escola pode alterar</option>
                    <option value="false">Não - Apenas data atual</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Permitir cancelar falta</Label>
                  <Select defaultValue="true">
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dias para edição</Label>
                  <Input type="number" defaultValue="7" placeholder="7" />
                  <p className="text-xs text-muted-foreground">Número de dias após a falta para permitir edição</p>
                </div>
                <div className="space-y-2">
                  <Label>Observação obrigatória</Label>
                  <Select defaultValue="false">
                    <option value="false">Não</option>
                    <option value="true">Sim</option>
                  </Select>
                </div>
              </div>
              <Button>Salvar Configurações</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Importação de Alunos</CardTitle>
              <CardDescription>Configurações de importação de alunos por PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Importação de Alunos Habilitada</Label>
                <Select
                  defaultValue={importEnabled}
                  onValueChange={setImportEnabled}
                >
                  <option value="true">Sim - Permitir importação</option>
                  <option value="false">Não - Desabilitar importação</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Escola para Importação</Label>
                <Select
                  value={selectedSchoolId}
                  onValueChange={setSelectedSchoolId}
                  disabled={importEnabled === false}
                >
                  <option value="">Selecione a escola</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </Select>
                <p className="text-sm text-muted-foreground">
                  A importação de alunos será direcionada apenas para a escola selecionada no
                  momento do processamento do PDF.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tabs === 'seguranca' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Autenticação e Segurança
              </CardTitle>
              <CardDescription>Configurações de login e proteção de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Supabase Auth Ativo</p>
                    <p className="text-sm text-green-700">Autenticação gerenciada pelo Supabase com RLS</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Senhas Iniciais do Sistema</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Senha Inicial</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Administrador</TableCell>
                      <TableCell><code>admin123</code></TableCell>
                      <TableCell><Badge variant="destructive">Fraca - Alterar urgente</Badge></TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Key className="h-4 w-4 mr-1" />
                          Alterar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Todas as Escolas</TableCell>
                      <TableCell><code>123</code></TableCell>
                      <TableCell><Badge variant="destructive">Muito fraca - Alterar urgente</Badge></TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Key className="h-4 w-4 mr-1" />
                          Alterar todas
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Atenção: Senhas Padrão</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      As senhas iniciais <code>admin123</code> e <code>123</code> são muito fracas.
                      Recomenda-se alterar imediatamente após o primeiro acesso.
                      O sistema usa Supabase Auth com hash bcrypt para armazenamento seguro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Row Level Security (RLS)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">RLS Habilitado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Políticas ativas em: schools, students, absences, school_users
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium">Isolamento por Escola</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escolas só veem seus próprios alunos e faltas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tabs === 'banco' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Schema do Banco de Dados
              </CardTitle>
              <CardDescription>Estrutura das tabelas e relacionamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>RLS</TableHead>
                      <TableHead>Registros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">schools</TableCell>
                      <TableCell>Escolas cadastradas</TableCell>
                      <TableCell><Badge variant="success">Ativo</Badge></TableCell>
                      <TableCell>19</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">students</TableCell>
                      <TableCell>Alunos vinculados às escolas</TableCell>
                      <TableCell><Badge variant="success">Ativo</Badge></TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">absences</TableCell>
                      <TableCell>Registros de faltas</TableCell>
                      <TableCell><Badge variant="success">Ativo</Badge></TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono">school_users</TableCell>
                      <TableCell>Vínculo usuário-escola</TableCell>
                      <TableCell><Badge variant="success">Ativo</Badge></TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(supabaseSchema)}>
                  <Download className="h-4 w-4 mr-2" />
                  Copiar Schema SQL
                </Button>
                <p className="text-sm text-muted-foreground">Schema completo para execução no Supabase SQL Editor</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Índices de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm font-mono">
                <li>idx_students_school_id ON students(school_id)</li>
                <li>idx_students_active ON students(active) WHERE active = true</li>
                <li>idx_absences_student_id ON absences(student_id)</li>
                <li>idx_absences_school_id ON absences(school_id)</li>
                <li>idx_absences_absence_date ON absences(absence_date)</li>
                <li>idx_absences_status ON absences(status)</li>
                <li>idx_school_users_user_id ON school_users(user_id)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {tabs === 'backup' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Backup e Recuperação
              </CardTitle>
              <CardDescription>Gerencie backups do banco de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Backup Automático Ativo</p>
                    <p className="text-sm text-green-700">Supabase realiza backups automáticos diários</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Download className="h-8 w-8 mx-auto" />
                  <span>Exportar Dados (CSV)</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2">
                  <Upload className="h-8 w-8 mx-auto" />
                  <span>Importar Backup</span>
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Informações de Backup</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Backups automáticos diários pelo Supabase (retidos por 7 dias no plano gratuito)</li>
                  <li>• Point-in-time recovery disponível</li>
                  <li>• Para backup manual, use: <code className="bg-muted px-1 rounded">pg_dump</code> ou Supabase Dashboard</li>
                  <li>• Dados de Storage (PDFs) têm backup separado</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                O sistema registra automaticamente ações importantes para auditoria:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Login de usuários (escola e admin)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Registro de faltas (quem, quando, qual aluno, qual escola)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Alterações em cadastros de alunos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Importação de PDFs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Criação/edição de escolas e usuários
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Os logs são armazenados nas tabelas com campos <code className="bg-muted px-1 rounded">created_at</code>, 
                <code className="bg-muted px-1 rounded">updated_at</code> e <code className="bg-muted px-1 rounded">registered_by</code>.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
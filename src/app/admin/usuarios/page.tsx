'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { School } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Key, UserPlus, Building2, Mail, Shield } from 'lucide-react'

type SchoolUser = {
  id: string
  school_id: string
  user_id: string
  created_at: string
  schools?: { name: string }
  users?: { email: string }
}

export default function UsuariosPage() {
  const { user } = useAuth()
  const [schoolUsers, setSchoolUsers] = useState<SchoolUser[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '', school_id: '', role: 'school' })
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchData = async () => {
    try {
      const [schoolsRes, usersRes] = await Promise.all([
        supabase.from('schools').select('*').eq('active', true).order('name'),
        supabase
          .from('school_users')
          .select(`
            *,
            schools(name),
            users(email)
          `)
          .order('created_at', { ascending: false })
      ])

      if (schoolsRes.error) throw schoolsRes.error
      if (usersRes.error) throw usersRes.error

      setSchools(schoolsRes.data || [])
      setSchoolUsers(usersRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (schoolUser?: SchoolUser) => {
    if (schoolUser) {
      setEditingUser(schoolUser)
      setFormData({ email: schoolUser.users?.email || '', password: '', school_id: schoolUser.school_id, role: 'school' })
    } else {
      setEditingUser(null)
      setFormData({ email: '', password: '', school_id: '', role: 'school' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ email: '', password: '', school_id: '', role: 'school' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: { role: formData.role, school_id: formData.school_id }
      })

      if (authError) throw authError

      // Link user to school
      const { error: linkError } = await supabase
        .from('school_users')
        .insert({ user_id: authData.user.id, school_id: formData.school_id })

      if (linkError) throw linkError

      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Erro ao criar usuário: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (schoolUser: SchoolUser) => {
    if (!confirm(`Tem certeza que deseja remover o usuário ${schoolUser.users?.email}?`)) return

    try {
      // Delete from school_users
      const { error } = await supabase
        .from('school_users')
        .delete()
        .eq('id', schoolUser.id)

      if (error) throw error

      // Optionally delete from auth (requires service role)
      // await supabase.auth.admin.deleteUser(schoolUser.user_id)

      fetchData()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Erro ao remover usuário')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Usuários
          </h1>
          <p className="text-muted-foreground">Gerencie usuários e acessos do sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários das Escolas ({schoolUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Escola</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schoolUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    schoolUsers.map(schoolUser => (
                      <TableRow key={schoolUser.id}>
                        <TableCell className="font-medium">{schoolUser.users?.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{schoolUser.schools?.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Escola</Badge>
                        </TableCell>
                        <TableCell>{new Date(schoolUser.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon">
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(schoolUser)}>
                              <Edit className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Usuário Administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">admin@sistema.com</p>
                <p className="text-sm text-muted-foreground">Administrador do sistema</p>
              </div>
            </div>
            <Badge variant="default">Admin</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            O usuário administrador é criado automaticamente na configuração inicial do Supabase.
            Email: <code className="bg-muted px-1 rounded">admin@sistema.com</code>
          </p>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário da Escola'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school_id">Escola *</Label>
                  <Select value={formData.school_id} onValueChange={v => setFormData({ ...formData, school_id: v })} required>
                    <option value="">Selecione a escola</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="usuario@escola.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder={editingUser ? 'Deixe em branco para não alterar' : 'Senha inicial'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Papel</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v })} disabled>
                    <option value="school">Escola</option>
                    <option value="admin">Administrador</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">Usuários de escola só podem acessar sua própria escola</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? 'Criando...' : editingUser ? 'Atualizar' : 'Criar Usuário'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
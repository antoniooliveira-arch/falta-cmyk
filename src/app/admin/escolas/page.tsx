'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { School } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Eye, Lock, Building } from 'lucide-react'
import { generateSchoolCode } from '@/lib/utils'

export default function EscolasPage() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [formData, setFormData] = useState({ name: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toggleAllLoading, setToggleAllLoading] = useState(false)

  const supabase = createClient()

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name')

      if (error) throw error
      setSchools(data || [])
    } catch (error) {
      console.error('Error fetching schools:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAllSchools = async () => {
    setToggleAllLoading(true)
    try {
      // First fetch current schools
      await fetchSchools()
      
      // Enable all schools
      const { error: toggleError } = await supabase
        .from('schools')
        .update({ active: true })
      
      if (toggleError) throw toggleError
      
      // Refresh the list
      await fetchSchools()
      alert('Todas as escolas foram ativadas com sucesso!')
    } catch (error) {
      console.error('Error activating schools:', error)
      alert('Erro ao ativar escolas')
    } finally {
      setToggleAllLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const handleOpenModal = (school?: School) => {
    if (school) {
      setEditingSchool(school)
      setFormData({ name: school.name, password: '' })
    } else {
      setEditingSchool(null)
      setFormData({ name: '', password: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSchool(null)
    setFormData({ name: '', password: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const code = generateSchoolCode(formData.name)

      if (editingSchool) {
        const updates: any = { name: formData.name, code }
        if (formData.password) {
          updates.password_hash = formData.password // Will be hashed by trigger
        }
        const { error } = await supabase
          .from('schools')
          .update(updates)
          .eq('id', editingSchool.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('schools')
          .insert({
            name: formData.name,
            code,
            password_hash: formData.password || '123'
          })

        if (error) throw error
      }

      handleCloseModal()
      fetchSchools()
    } catch (error) {
      console.error('Error saving school:', error)
      alert('Erro ao salvar escola')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (school: School) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ active: !school.active })
        .eq('id', school.id)

      if (error) throw error
      fetchSchools()
    } catch (error) {
      console.error('Error toggling school:', error)
      alert('Erro ao alterar status da escola')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8" />
            Escolas
          </h1>
          <p className="text-muted-foreground">Gerencie as escolas cadastradas no sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Escola
        </Button>
        <Button
          variant="default"
          onClick={handleToggleAllSchools}
          disabled={toggleAllLoading}
          className="mr-2"
        >
          {toggleAllLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Ativando...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Ativar Todas
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Escolas ({schools.length})</CardTitle>
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="w-40">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map(school => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{school.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={school.active ? 'success' : 'destructive'}>
                          {school.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(school.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(school)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleActive(school)}>
                            {school.active ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Lock className="h-4 w-4 text-primary" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingSchool ? 'Editar Escola' : 'Nova Escola'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Escola *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: CEI LUIZ FELIPE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingSchool ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Inicial *'} </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required={!editingSchool}
                    placeholder={editingSchool ? 'Nova senha' : 'Ex: 123'}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? 'Salvando...' : editingSchool ? 'Salvar Alterações' : 'Cadastrar'}
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
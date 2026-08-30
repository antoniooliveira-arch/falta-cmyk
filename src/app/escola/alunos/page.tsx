'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Student } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AlunosPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    responsible: '',
    class: '',
    phone1: '',
    phone2: ''
  })

  const supabase = createClient()

  const fetchStudents = async () => {
    if (!user?.school_id) return
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', user.school_id)
        .eq('active', true)
        .order('name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [user?.school_id])

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.responsible.toLowerCase().includes(search.toLowerCase()) ||
    student.class.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student)
      setFormData({
        name: student.name,
        responsible: student.responsible,
        class: student.class,
        phone1: student.phone1,
        phone2: student.phone2 || ''
      })
    } else {
      setEditingStudent(null)
      setFormData({ name: '', responsible: '', class: '', phone1: '', phone2: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingStudent(null)
    setFormData({ name: '', responsible: '', class: '', phone1: '', phone2: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.school_id) return

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', editingStudent.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('students')
          .insert({ ...formData, school_id: user.school_id })

        if (error) throw error
      }

      handleCloseModal()
      fetchStudents()
    } catch (error) {
      console.error('Error saving student:', error)
      alert('Erro ao salvar aluno')
    }
  }

  const handleDelete = async (student: Student) => {
    if (!confirm(`Tem certeza que deseja inativar o aluno ${student.name}?`)) return

    try {
      const { error } = await supabase
        .from('students')
        .update({ active: false })
        .eq('id', student.id)

      if (error) throw error
      fetchStudents()
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Erro ao inativar aluno')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>
          <p className="text-muted-foreground">Gerencie os alunos da sua escola</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Lista de Alunos</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno, responsável ou turma..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
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
                    <TableHead>Responsável</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Fone 1</TableHead>
                    <TableHead>Fone 2</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum aluno encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.responsible}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.class}</Badge>
                        </TableCell>
                        <TableCell>{student.phone1}</TableCell>
                        <TableCell>{student.phone2 || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(student)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(student)}>
                              <Eye className="h-4 w-4 text-destructive" />
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nome *</label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nome do aluno"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="responsible" className="text-sm font-medium">Responsável *</label>
                  <Input
                    id="responsible"
                    value={formData.responsible}
                    onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                    required
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="class" className="text-sm font-medium">Turma *</label>
                  <Input
                    id="class"
                    value={formData.class}
                    onChange={e => setFormData({ ...formData, class: e.target.value })}
                    required
                    placeholder="Ex: 3A, 4B, etc."
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone1" className="text-sm font-medium">Fone 1 *</label>
                  <Input
                    id="phone1"
                    type="tel"
                    value={formData.phone1}
                    onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                    required
                    placeholder="(99) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone2" className="text-sm font-medium">Fone 2</label>
                  <Input
                    id="phone2"
                    type="tel"
                    value={formData.phone2}
                    onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                    placeholder="(99) 99999-9999"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingStudent ? 'Salvar Alterações' : 'Cadastrar'}
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
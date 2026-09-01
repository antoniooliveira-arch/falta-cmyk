'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Student, School } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Search, Filter, Download, UserPlus } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function AlunosAdminPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('TODAS')
  const [classFilter, setClassFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    responsible: '',
    class: '',
    phone1: '',
    phone2: '',
    school_id: ''
  })
  const [classOption, setClassOption] = useState('')
  const [customClass, setCustomClass] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchData = async () => {
    try {
      const [schoolsRes, studentsRes] = await Promise.all([
        supabase.from('schools').select('*').eq('active', true).order('name'),
        supabase.from('students').select('*').eq('active', true).order('name')
      ])

      if (schoolsRes.error) throw schoolsRes.error
      if (studentsRes.error) throw studentsRes.error

      setSchools(schoolsRes.data || [])
      setStudents(studentsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.responsible.toLowerCase().includes(search.toLowerCase()) ||
      student.class.toLowerCase().includes(search.toLowerCase())
    const matchesSchool = schoolFilter === 'TODAS' || student.school_id === schoolFilter
    const matchesClass = !classFilter || student.class.toLowerCase().includes(classFilter.toLowerCase())
    return matchesSearch && matchesSchool && matchesClass
  })

  const classes = [...new Set(students.map(s => s.class))].sort()

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student)
      setFormData({
        name: student.name,
        responsible: student.responsible,
        class: student.class,
        phone1: student.phone1,
        phone2: student.phone2 || '',
        school_id: student.school_id
      })
      const known = classes.includes(student.class)
      setClassOption(known ? student.class : '__custom__')
      setCustomClass(known ? '' : student.class)
    } else {
      setEditingStudent(null)
      setFormData({ name: '', responsible: '', class: '', phone1: '', phone2: '', school_id: '' })
      setClassOption('')
      setCustomClass('')
    }
    setShowModal(true)
  }

  const handleClassChange = (value: string) => {
    setClassOption(value)
    if (value === '__custom__') {
      setFormData(prev => ({ ...prev, class: customClass }))
    } else {
      setFormData(prev => ({ ...prev, class: value }))
    }
  }

  const handleCustomClassChange = (value: string) => {
    setCustomClass(value)
    setFormData(prev => ({ ...prev, class: value }))
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingStudent(null)
    setFormData({ name: '', responsible: '', class: '', phone1: '', phone2: '', school_id: '' })
    setClassOption('')
    setCustomClass('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            name: formData.name,
            responsible: formData.responsible,
            class: formData.class,
            phone1: formData.phone1,
            phone2: formData.phone2,
            school_id: formData.school_id
          })
          .eq('id', editingStudent.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('students')
          .insert(formData)

        if (error) throw error
      }

      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error('Error saving student:', error)
      alert('Erro ao salvar aluno')
    } finally {
      setSubmitting(false)
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
      fetchData()
    } catch (error) {
      console.error('Error deleting student:', error)
      alert('Erro ao inativar aluno')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="h-8 w-8" />
            Alunos
          </h1>
          <p className="text-muted-foreground">Gerencie todos os alunos do sistema</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Aluno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno, responsável ou turma..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <option value="TODAS">Todas as escolas</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <option value="">Todas as turmas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" onClick={() => { setSearch(''); setSchoolFilter('TODAS'); setClassFilter('') }}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos ({filteredStudents.length})</CardTitle>
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
                    <TableHead>Escola</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum aluno encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => {
                      const school = schools.find(s => s.id === student.school_id)
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.responsible}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student.class}</Badge>
                          </TableCell>
                          <TableCell>{student.phone1}</TableCell>
                          <TableCell>{student.phone2 || '-'}</TableCell>
                          <TableCell>{school?.name}</TableCell>
                          <TableCell>{formatDate(student.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(student)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(student)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
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
            <CardHeader className="bg-gradient-to-r from-primary to-blue-500 text-primary-foreground rounded-t-lg">
              <CardTitle>{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</CardTitle>
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
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nome do aluno"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável *</Label>
                  <Input
                    id="responsible"
                    value={formData.responsible}
                    onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                    required
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Turma *</Label>
                  {classOption === '__custom__' ? (
                    <Input
                      id="class"
                      value={customClass}
                      onChange={e => handleCustomClassChange(e.target.value)}
                      required
                      placeholder="Digite o nome da nova turma"
                    />
                  ) : (
                    <>
                      <Select
                        id="class"
                        value={classOption}
                        onValueChange={handleClassChange}
                        required
                      >
                        <option value="" disabled>Selecione a turma</option>
                        <option value="__custom__">+ Nova turma...</option>
                        {classes.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </Select>
                      {classOption && classOption !== '__custom__' && (
                        <p className="text-xs text-muted-foreground">
                          Quer outra turma? <button type="button" className="underline text-primary" onClick={() => handleClassChange('__custom__')}>digite manualmente</button>
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone1">Fone 1 *</Label>
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
                  <Label htmlFor="phone2">Fone 2</Label>
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
                  <Button type="submit" className="flex-1" disabled={submitting}>
                    {submitting ? 'Salvando...' : editingStudent ? 'Salvar Alterações' : 'Cadastrar'}
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
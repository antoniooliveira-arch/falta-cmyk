'use client'

import { useState, useEffect, Fragment } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Student, Absence } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

export default function FaltasPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0])
  const [observation, setObservation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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
    (!classFilter || student.class === classFilter) &&
    (student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.responsible.toLowerCase().includes(search.toLowerCase()))
  )

  const classOptions = Array.from(new Set(students.map(s => s.class).filter(Boolean))).sort((a, b) => {
    const getType = (c: string) => c.toLowerCase().includes('ber') ? 0 : c.toLowerCase().includes('maternal') ? 1 : 2
    return getType(a) - getType(b) || a.localeCompare(b, 'pt-BR', { numeric: true })
  })

  const groupedStudents = classOptions
    .map(cls => ({ cls, items: filteredStudents.filter(s => s.class === cls) }))
    .filter(g => g.items.length > 0)
  const showGrouping = !classFilter

  const handleRegisterAbsence = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStudents.length === 0 || !user?.school_id) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('absences')
        .insert(selectedStudents.map(student => ({
          student_id: student.id,
          school_id: user.school_id,
          absence_date: absenceDate,
          observation: observation || null,
          registered_by: user.id,
          status: 'ENVIADA'
        })))

      if (error) throw error

      setSuccess(true)
      setSelectedStudents([])
      setObservation('')
      setAbsenceDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      console.error('Error registering absence:', error)
      alert('Erro ao registrar falta')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSelectStudent = (student: Student) => {
    setSelectedStudents(prev =>
      prev.some(s => s.id === student.id)
        ? prev.filter(s => s.id !== student.id)
        : [...prev, student]
    )
    setSuccess(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Registrar Faltas</h1>
        <p className="text-muted-foreground">Selecione o aluno e registre a falta</p>
      </div>

      {success && (
        <Card className="border-success bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-success">
              <CheckCircle className="h-6 w-6" />
              <div>
                <p className="font-medium">Falta registrada com sucesso!</p>
                <p className="text-sm">O registro foi enviado para o administrador.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alunos da Escola</CardTitle>
          <CardDescription>Filtre por turma ou busque o aluno para registrar a falta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno ou responsável..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select
                value={classFilter}
                onValueChange={setClassFilter}
              >
                <option value="">Todas as turmas ({students.length})</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>
                    {cls} ({students.filter(s => s.class === cls).length})
                  </option>
                ))}
              </Select>
            </div>
          </div>

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
                    <TableHead className="w-32">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {classFilter ? `Nenhum aluno na turma ${classFilter}` : 'Nenhum aluno encontrado'}
                      </TableCell>
                    </TableRow>
                  ) : showGrouping ? (
                    groupedStudents.map(group => (
                      <Fragment key={group.cls}>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={6} className="py-2 font-semibold text-primary">
                            {group.cls}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              ({group.items.length} alunos)
                            </span>
                          </TableCell>
                        </TableRow>
                        {group.items.map(student => (
                          <StudentRow
                            key={student.id}
                            student={student}
                            isSelected={selectedStudents.some(s => s.id === student.id)}
                            onToggle={toggleSelectStudent}
                          />
                        ))}
                      </Fragment>
                    ))
                  ) : (
                    filteredStudents.map(student => (
                      <StudentRow
                        key={student.id}
                        student={student}
                        isSelected={selectedStudents.some(s => s.id === student.id)}
                        onToggle={toggleSelectStudent}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudents.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary to-blue-500 text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Registrar Faltas ({selectedStudents.length} aluno{selectedStudents.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-2">
              {selectedStudents.map(student => (
                <div key={student.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.class} • {student.responsible}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSelectStudent(student)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>

            <form onSubmit={handleRegisterAbsence} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="absenceDate">Data da Falta *</Label>
                <Input
                  id="absenceDate"
                  type="date"
                  value={absenceDate}
                  onChange={e => setAbsenceDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observation">Observação</Label>
                <Input
                  id="observation"
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  placeholder="Motivo da falta, observações adicionais..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setSelectedStudents([])} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Enviando...' : `ENVIAR (${selectedStudents.length}) PARA ADMINISTRADOR`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StudentRow({ student, isSelected, onToggle }: {
  student: Student
  isSelected: boolean
  onToggle: (student: Student) => void
}) {
  return (
    <TableRow className={isSelected ? 'bg-primary/5' : undefined}>
      <TableCell className="font-medium">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(student)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
          {student.name}
        </label>
      </TableCell>
      <TableCell>{student.responsible}</TableCell>
      <TableCell>
        <Badge variant="secondary">{student.class}</Badge>
      </TableCell>
      <TableCell>{student.phone1}</TableCell>
      <TableCell>{student.phone2 || '-'}</TableCell>
      <TableCell>
        <Button
          size="sm"
          variant={isSelected ? 'default' : 'outline'}
          onClick={() => onToggle(student)}
        >
          {isSelected ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Selecionado
            </>
          ) : (
            'Selecionar'
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}
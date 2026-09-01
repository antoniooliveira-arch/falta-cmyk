'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Absence, School } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Calendar, Download, Eye, Building, Users, GraduationCap, User } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function FaltasAdminPage() {
  const { user } = useAuth()
  const [absences, setAbsences] = useState<Absence[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('TODAS')
  const [classFilter, setClassFilter] = useState('')
  const [studentFilter, setStudentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null)

  const supabase = createClient()

  const fetchData = async () => {
    try {
      const [schoolsRes, absencesRes] = await Promise.all([
        supabase.from('schools').select('*').eq('active', true).order('name'),
        supabase
          .from('absences')
          .select(`
            *,
            students!inner(name, responsible, class, phone1, phone2, school_id),
            schools!inner(name)
          `)
          .order('created_at', { ascending: false })
          .limit(500)
      ])

      if (schoolsRes.error) throw schoolsRes.error
      if (absencesRes.error) throw absencesRes.error

      setSchools(schoolsRes.data || [])
      setAbsences(absencesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const classes = [...new Set(absences.map(a => (a.students as any)?.class).filter(Boolean))].sort()
  const students = [...new Set(absences.map(a => (a.students as any)?.name).filter(Boolean))].sort()

  const filteredAbsences = absences.filter(absence => {
    const student = absence.students as any
    const school = absence.schools as any
    const matchesSearch = search === '' ||
      student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      student?.responsible?.toLowerCase().includes(search.toLowerCase()) ||
      student?.class?.toLowerCase().includes(search.toLowerCase())
    const matchesSchool = schoolFilter === 'TODAS' || school?.id === schoolFilter
    const matchesClass = classFilter === '' || student?.class === classFilter
    const matchesStudent = studentFilter === '' || student?.name === studentFilter
    const matchesStatus = statusFilter === 'TODOS' || absence.status === statusFilter
    const matchesDateStart = !dateRange.start || absence.absence_date >= dateRange.start
    const matchesDateEnd = !dateRange.end || absence.absence_date <= dateRange.end
    return matchesSearch && matchesSchool && matchesClass && matchesStudent && matchesStatus && matchesDateStart && matchesDateEnd
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ENVIADA':
        return <Badge variant="success">ENVIADA</Badge>
      case 'VISUALIZADA':
        return <Badge variant="default">VISUALIZADA</Badge>
      case 'CANCELADA':
        return <Badge variant="destructive">CANCELADA</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleViewAbsence = (absence: Absence) => {
    setSelectedAbsence(absence)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8" />
            Faltas
          </h1>
          <p className="text-muted-foreground">Visualize e gerencie todas as faltas do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label>Aluno</Label>
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <option value="">Todos os alunos</option>
                {students.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <option value="TODOS">Todos</option>
                <option value="ENVIADA">ENVIADA</option>
                <option value="VISUALIZADA">VISUALIZADA</option>
                <option value="CANCELADA">CANCELADA</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button variant="outline" onClick={() => {
                setSearch(''); setSchoolFilter('TODAS'); setClassFilter(''); setStudentFilter('');
                setStatusFilter('TODOS'); setDateRange({ start: '', end: '' })
              }} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Faltas ({filteredAbsences.length})</CardTitle>
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
                    <TableHead>Escola</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Fone 1</TableHead>
                    <TableHead>Fone 2</TableHead>
                    <TableHead>Data Falta</TableHead>
                    <TableHead>Data Registro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAbsences.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Nenhuma falta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAbsences.map(absence => {
                      const student = absence.students as any
                      const school = absence.schools as any
                      return (
                        <TableRow key={absence.id}>
                          <TableCell>
                            <Badge variant="outline">{school?.name}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{student?.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student?.class}</Badge>
                          </TableCell>
                          <TableCell>{student?.responsible}</TableCell>
                          <TableCell>{student?.phone1}</TableCell>
                          <TableCell>{student?.phone2 || '-'}</TableCell>
                          <TableCell>{formatDate(absence.absence_date)}</TableCell>
                          <TableCell>{formatDateTime(absence.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(absence.status)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleViewAbsence(absence)}>
                              <Eye className="h-4 w-4" />
                            </Button>
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

      {selectedAbsence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedAbsence(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <CardHeader className="bg-gradient-to-r from-primary to-blue-500 text-primary-foreground rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes da Falta</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedAbsence(null)} className="text-primary-foreground hover:bg-white/20">
                  <span className="sr-only">Fechar</span>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Escola</p>
                  <p className="font-medium">{(selectedAbsence.schools as any)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aluno</p>
                  <p className="font-medium">{(selectedAbsence.students as any)?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turma</p>
                  <p className="font-medium">{(selectedAbsence.students as any)?.class}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{(selectedAbsence.students as any)?.responsible}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fone 1</p>
                  <p className="font-medium">{(selectedAbsence.students as any)?.phone1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fone 2</p>
                  <p className="font-medium">{(selectedAbsence.students as any)?.phone2 || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data da Falta</p>
                  <p className="font-medium">{formatDate(selectedAbsence.absence_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Registro</p>
                  <p className="font-medium">{formatDateTime(selectedAbsence.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{getStatusBadge(selectedAbsence.status)}</p>
                </div>
              </div>
              {selectedAbsence.observation && (
                <div>
                  <p className="text-sm text-muted-foreground">Observação</p>
                  <p className="font-medium">{selectedAbsence.observation}</p>
                </div>
              )}
              <Button variant="outline" onClick={() => setSelectedAbsence(null)} className="w-full">
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
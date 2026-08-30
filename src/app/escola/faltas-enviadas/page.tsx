'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Absence } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar, Filter, Download } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

export default function FaltasEnviadasPage() {
  const { user } = useAuth()
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const supabase = createClient()

  const fetchAbsences = async () => {
    if (!user?.school_id) return
    try {
      let query = supabase
        .from('absences')
        .select(`
          *,
          students!inner(name, responsible, class, phone1, phone2)
        `)
        .eq('school_id', user.school_id)
        .order('created_at', { ascending: false })

      if (dateRange.start) {
        query = query.gte('absence_date', dateRange.start)
      }
      if (dateRange.end) {
        query = query.lte('absence_date', dateRange.end)
      }
      if (statusFilter !== 'TODOS') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setAbsences(data || [])
    } catch (error) {
      console.error('Error fetching absences:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAbsences()
  }, [user?.school_id, dateRange.start, dateRange.end, statusFilter])

  const filteredAbsences = absences.filter(absence => {
    const student = absence.students as any
    const searchLower = search.toLowerCase()
    return (
      student?.name?.toLowerCase().includes(searchLower) ||
      student?.responsible?.toLowerCase().includes(searchLower) ||
      student?.class?.toLowerCase().includes(searchLower)
    )
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Faltas Enviadas</h1>
          <p className="text-muted-foreground">Histórico de faltas registradas pela escola</p>
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
          <CardTitle>Filtros</CardTitle>
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
              <Label>Status</Label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="TODOS">Todos</option>
                <option value="ENVIADA">ENVIADA</option>
                <option value="VISUALIZADA">VISUALIZADA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
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
                    <TableHead>Data da Falta</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Fone 1</TableHead>
                    <TableHead>Fone 2</TableHead>
                    <TableHead>Data Registro</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAbsences.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma falta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAbsences.map(absence => {
                      const student = absence.students as any
                      return (
                        <TableRow key={absence.id}>
                          <TableCell>{formatDate(absence.absence_date)}</TableCell>
                          <TableCell className="font-medium">{student?.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student?.class}</Badge>
                          </TableCell>
                          <TableCell>{student?.responsible}</TableCell>
                          <TableCell>{student?.phone1}</TableCell>
                          <TableCell>{student?.phone2 || '-'}</TableCell>
                          <TableCell>{formatDateTime(absence.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(absence.status)}</TableCell>
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
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase/client'
import { School, Student } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Eye, AlertCircle, CheckCircle, XCircle, RefreshCw, School as SchoolIcon } from 'lucide-react'
import { parsePDF, PDFStudentData } from '@/lib/pdf-parser'
import { generateSchoolCode } from '@/lib/utils'

export default function ImportarPDFPage() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extractedStudents, setExtractedStudents] = useState<PDFStudentData[]>([])
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchSchools = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setSchools(data || [])
    } catch (error) {
      console.error('Error fetching schools:', error)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Por favor, selecione um arquivo PDF')
        return
      }
      setPdfFile(file)
      setError('')
      setExtractedStudents([])
      setShowPreview(false)
    }
  }

  const handleExtract = async () => {
    if (!pdfFile) {
      setError('Selecione um arquivo PDF primeiro')
      return
    }

    setExtracting(true)
    setError('')

    try {
      const students = await parsePDF(pdfFile)
      setExtractedStudents(students)
      setShowPreview(true)
    } catch (err) {
      setError('Erro ao processar o PDF: ' + (err as Error).message)
    } finally {
      setExtracting(false)
    }
  }

  const handleImport = async () => {
    if (!selectedSchoolId || extractedStudents.length === 0) return

    setImporting(true)
    setError('')

    try {
      const validStudents = extractedStudents.filter(s => !s.needs_review)
      
      if (validStudents.length === 0) {
        setError('Nenhum aluno válido para importar. Revise os dados primeiro.')
        return
      }

      const studentsToInsert = validStudents.map(s => ({
        name: s.name,
        responsible: s.responsible,
        class: s.class,
        phone1: s.phone1,
        phone2: s.phone2,
        school_id: selectedSchoolId
      }))

      const { error } = await supabase
        .from('students')
        .insert(studentsToInsert)

      if (error) throw error

      alert(`${validStudents.length} aluno(s) importado(s) com sucesso!`)
      setExtractedStudents([])
      setPdfFile(null)
      setShowPreview(false)
      const fileInput = document.getElementById('pdf-file') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err) {
      setError('Erro ao importar alunos: ' + (err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const getStatusIcon = (student: PDFStudentData) => {
    if (student.needs_review) return <AlertCircle className="h-4 w-4 text-warning" />
    return <CheckCircle className="h-4 w-4 text-success" />
  }

  const selectedSchool = schools.find(s => s.id === selectedSchoolId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Importar Alunos por PDF
        </h1>
        <p className="text-muted-foreground">Importe alunos em lote a partir de arquivos PDF</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração da Importação</CardTitle>
          <CardDescription>Selecione a escola e o arquivo PDF com os dados dos alunos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="school">Escola *</Label>
              <Select
                id="school"
                value={selectedSchoolId}
                onValueChange={setSelectedSchoolId}
                required
              >
                <option value="">Selecione a escola</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Arquivo PDF *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="pdf-file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Clique ou arraste o arquivo PDF aqui</p>
                      <p className="text-sm text-muted-foreground">Apenas arquivos .pdf</p>
                    </div>
                  </div>
                </label>
                {pdfFile && (
                  <div className="mt-3 p-3 bg-muted rounded flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-primary" />
                      <div>
                        <p className="font-medium">{pdfFile.name}</p>
                        <p className="text-sm text-muted-foreground">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setPdfFile(null); setExtractedStudents([]); setShowPreview(false); }}>
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive p-3 bg-destructive/10 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleExtract}
              disabled={!pdfFile || extracting}
              className="flex-1"
            >
              {extracting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Processar e Visualizar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setPdfFile(null); setExtractedStudents([]); setShowPreview(false); }}
              disabled={!pdfFile}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && extractedStudents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alunos Identificados no PDF ({extractedStudents.length})</CardTitle>
              <Badge variant={extractedStudents.some(s => s.needs_review) ? 'warning' : 'success'}>
                {extractedStudents.filter(s => s.needs_review).length} precisam de revisão
              </Badge>
            </div>
            <CardDescription>
              Revise os dados abaixo antes de confirmar a importação. Alunos marcados com ⚠ precisam de correção.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Fone 1</TableHead>
                    <TableHead>Fone 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedStudents.map((student, index) => (
                    <TableRow key={index} className={student.needs_review ? 'bg-warning/5' : ''}>
                      <TableCell>{getStatusIcon(student)}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.responsible}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.class}</Badge>
                      </TableCell>
                      <TableCell>{student.phone1 || '-'}</TableCell>
                      <TableCell>{student.phone2 || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {extractedStudents.some(s => s.needs_review) && (
              <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="font-medium text-warning flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Atenção: {extractedStudents.filter(s => s.needs_review).length} aluno(s) precisam de revisão
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Alunos com dados incompletos ou inválidos não serão importados. 
                  Corrija o PDF ou cadastre manualmente.
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedSchoolId || importing || extractedStudents.every(s => s.needs_review)}
                className="flex-1"
              >
                {importing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Importação ({extractedStudents.filter(s => !s.needs_review).length})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formato Esperado do PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            O sistema tenta extrair automaticamente os seguintes campos do PDF:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted rounded">
              <p className="font-medium">Nome do aluno</p>
              <p className="text-muted-foreground">Nome completo do estudante</p>
            </div>
            <div className="p-3 bg-muted rounded">
              <p className="font-medium">Responsável</p>
              <p className="text-muted-foreground">Nome do responsável legal</p>
            </div>
            <div className="p-3 bg-muted rounded">
              <p className="font-medium">Turma</p>
              <p className="text-muted-foreground">Ex: 3A, 4B, 5º Ano</p>
            </div>
            <div className="p-3 bg-muted rounded">
              <p className="font-medium">Fone 1</p>
              <p className="text-muted-foreground">Telefone principal (com DDD)</p>
            </div>
            <div className="p-3 bg-muted rounded">
              <p className="font-medium">Fone 2</p>
              <p className="text-muted-foreground">Telefone secundário (opcional)</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded">
            <p className="font-medium mb-2">Exemplo de formato tabular suportado:</p>
            <pre className="text-xs overflow-x-auto bg-background p-2 rounded">
{`NOME             RESPONSÁVEL       TURMA    FONE 1       FONE 2
João da Silva    Maria da Silva     3A       99999-1111   99999-2222
Ana Souza        Carlos Souza       3A       99999-3333   99999-4444
Pedro Santos     João Santos        3B       99999-5555   99999-6666`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
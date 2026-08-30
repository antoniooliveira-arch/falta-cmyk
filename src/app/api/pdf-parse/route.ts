import { NextRequest, NextResponse } from 'next/server'
import { PDFStudentData } from '@/types/database'

// Dynamic import for pdf-parse to avoid build issues
async function getPdfParse(): Promise<(buffer: Buffer) => Promise<{ text: string }>> {
  const module = await import('pdf-parse')
  // pdf-parse v2+ has different export structure
  // @ts-expect-error - pdf-parse has complex module structure
  return module.default || module.parse || module
}

function extractStudentsFromText(text: string): PDFStudentData[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const students: PDFStudentData[] = []

  for (const line of lines) {
    if (isHeaderLine(line)) continue

    const student = parseStudentLine(line)
    if (student) {
      students.push(student)
    }
  }

  if (students.length === 0) {
    return parseAlternativeFormat(text)
  }

  return students
}

function isHeaderLine(line: string): boolean {
  const upperLine = line.toUpperCase()
  const headerKeywords = ['NOME', 'RESPONSÁVEL', 'RESPONSAVEL', 'TURMA', 'FONE', 'TELEFONE', 'CLASSE', 'SÉRIE', 'SERIE']
  return headerKeywords.some(keyword => upperLine.includes(keyword))
}

function parseStudentLine(line: string): PDFStudentData | null {
  const parts = line.split(/\s{2,}|\t/).map(p => p.trim()).filter(p => p.length > 0)
  
  if (parts.length < 3) return null

  let name = ''
  let responsible = ''
  let className = ''
  let phone1 = ''
  let phone2: string | null = null
  let needsReview = false
  let reviewReason = ''

  if (parts.length >= 5) {
    name = parts[0]
    responsible = parts[1]
    className = parts[2]
    phone1 = parts[3]
    phone2 = parts[4]
  } else if (parts.length === 4) {
    name = parts[0]
    responsible = parts[1]
    className = parts[2]
    phone1 = parts[3]
    needsReview = true
    reviewReason = 'Fone 2 não encontrado'
  } else if (parts.length === 3) {
    name = parts[0]
    responsible = parts[1]
    className = parts[2]
    needsReview = true
    reviewReason = 'Telefones não encontrados'
  }

  if (!name || name.length < 2) {
    needsReview = true
    reviewReason = (reviewReason ? reviewReason + '; ' : '') + 'Nome inválido'
  }
  if (!responsible || responsible.length < 2) {
    needsReview = true
    reviewReason = (reviewReason ? reviewReason + '; ' : '') + 'Responsável inválido'
  }
  if (!className || className.length < 1) {
    needsReview = true
    reviewReason = (reviewReason ? reviewReason + '; ' : '') + 'Turma inválida'
  }

  phone1 = phone1.replace(/\D/g, '')
  if (phone2) phone2 = phone2.replace(/\D/g, '')

  if (phone1.length < 10) {
    needsReview = true
    reviewReason = (reviewReason ? reviewReason + '; ' : '') + 'Fone 1 inválido'
  }

  return {
    name: name.trim(),
    responsible: responsible.trim(),
    class: className.trim(),
    phone1: phone1 || '',
    phone2: phone2 || null,
    needs_review: needsReview,
    review_reason: needsReview ? reviewReason : undefined
  }
}

function parseAlternativeFormat(text: string): PDFStudentData[] {
  const students: PDFStudentData[] = []
  
  const patterns = [
    /([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇa-záàâãéèêíïóôõöúüç\s]+?)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇa-záàâãéèêíïóôõöúüç\s]+?)\s+([A-Z0-9]+)\s+(\d{10,11})\s*(\d{10,11})?/g,
    /([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇa-záàâãéèêíïóôõöúüç\s]{3,})\n([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇa-záàâãéèêíïóôõöúüç\s]{3,})\n([A-Z0-9]{1,3})\n(\d{10,11})\n?(\d{10,11})?/g
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const [, name, responsible, className, phone1, phone2] = match
      students.push({
        name: name.trim(),
        responsible: responsible.trim(),
        class: className.trim(),
        phone1: phone1.replace(/\D/g, ''),
        phone2: phone2 ? phone2.replace(/\D/g, '') : null,
        needs_review: false
      })
    }
    if (students.length > 0) break
  }

  return students
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Arquivo deve ser PDF' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const pdfParse = await getPdfParse()
    const data = await pdfParse(buffer)
    const text = data.text
    const students = extractStudentsFromText(text)

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Error parsing PDF:', error)
    return NextResponse.json({ error: 'Falha ao processar o PDF' }, { status: 500 })
  }
}
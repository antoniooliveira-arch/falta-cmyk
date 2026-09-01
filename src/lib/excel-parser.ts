import * as XLSX from 'xlsx'
import { PDFStudentData } from '@/types/database'

export type { PDFStudentData }

const COLUMN_ALIASES: Record<string, keyof PDFStudentData> = {
  'NOME': 'name',
  'NOME DO ALUNO': 'name',
  'ALUNO': 'name',
  'ESTUDANTE': 'name',
  'RESPONSÁVEL': 'responsible',
  'RESPONSAVEL': 'responsible',
  'NOME DO RESPONSÁVEL': 'responsible',
  'TURMA': 'class',
  'CLASSE': 'class',
  'SÉRIE': 'class',
  'SERIE': 'class',
  'FONE 1': 'phone1',
  'FONE1': 'phone1',
  'TELEFONE 1': 'phone1',
  'TELEFONE1': 'phone1',
  'TELEFONE': 'phone1',
  'FONE': 'phone1',
  'CELULAR': 'phone1',
  'CELULAR 1': 'phone1',
  'FONE 2': 'phone2',
  'FONE2': 'phone2',
  'TELEFONE 2': 'phone2',
  'TELEFONE2': 'phone2',
  'CELULAR 2': 'phone2',
}

function normalizeHeader(header: string): string {
  return header.toUpperCase().trim()
}

function mapColumns(headers: string[]): Map<number, keyof PDFStudentData> {
  const columnMap = new Map<number, keyof PDFStudentData>()

  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header)
    if (COLUMN_ALIASES[normalized]) {
      columnMap.set(index, COLUMN_ALIASES[normalized])
    }
  })

  return columnMap
}

function validateAndCleanStudent(data: Partial<PDFStudentData>): PDFStudentData {
  const name = (data.name || '').trim()
  const responsible = (data.responsible || '').trim()
  const className = (data.class || '').trim()
  const phone1Raw = (data.phone1 || '').trim()
  const phone2Raw = (data.phone2 || '').trim()

  let needsReview = false
  const reviewReasons: string[] = []

  if (!name || name.length < 2) {
    needsReview = true
    reviewReasons.push('Nome inválido')
  }
  if (!responsible || responsible.length < 2) {
    needsReview = true
    reviewReasons.push('Responsável inválido')
  }
  if (!className || className.length < 1) {
    needsReview = true
    reviewReasons.push('Turma inválida')
  }

  const phone1 = phone1Raw.replace(/\D/g, '')
  const phone2 = phone2Raw ? phone2Raw.replace(/\D/g, '') : null

  if (!phone1 || phone1.length < 10) {
    needsReview = true
    reviewReasons.push('Fone 1 inválido')
  }

  return {
    name,
    responsible,
    class: className,
    phone1,
    phone2: phone2 && phone2.length >= 10 ? phone2 : null,
    needs_review: needsReview,
    review_reason: needsReview ? reviewReasons.join('; ') : undefined
  }
}

export async function parseExcel(file: File): Promise<PDFStudentData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]

        if (!sheetName) {
          reject(new Error('Planilha vazia'))
          return
        }

        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 })

        if (jsonData.length === 0) {
          reject(new Error('Planilha vazia'))
          return
        }

        const headerRow = Object.values(jsonData[0] || {}).map(h => String(h || ''))
        const columnMap = mapColumns(headerRow)

        if (columnMap.size === 0) {
          reject(new Error('Cabeçalhos não reconhecidos. Use colunas: NOME, RESPONSÁVEL, TURMA, FONE 1, FONE 2'))
          return
        }

        const students: PDFStudentData[] = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]
          if (!row || row.length === 0) continue

          const rawData: Partial<PDFStudentData> = {}
          columnMap.forEach((field, colIndex) => {
            const value = row[colIndex]
            if (value !== undefined && value !== null) {
              (rawData as Record<string, unknown>)[field] = String(value).trim()
            }
          })

          if (!rawData.name && !rawData.responsible) continue

          students.push(validateAndCleanStudent(rawData))
        }

        resolve(students)
      } catch (err) {
        reject(new Error('Falha ao processar o arquivo Excel'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo'))
    }

    reader.readAsArrayBuffer(file)
  })
}

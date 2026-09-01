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
  'FILIAÇÃO': 'responsible',
  'FILIACAO': 'responsible',
  'FILIAÇÃO 1': 'responsible',
  'FILIACAO 1': 'responsible',
  'FILIAÇÃO 2': 'responsible',
  'FILIACAO 2': 'responsible',
  'RESPONSÁVEL 1': 'responsible',
  'RESPONSAVEL 1': 'responsible',
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

function extractResponsibleName(raw: string): string {
  const value = raw.trim()

  const filiacaoMatch = value.match(/Filia[çc][aã]o\s*1\s*[:*-]?\s*([A-Za-zÁ-ÿÀ-ú\s]+?)\s+End/iu)
  if (filiacaoMatch) {
    return filiacaoMatch[1].trim()
  }

  const nameUntilEnd = value.match(/^([A-Za-zÁ-ÿÀ-ú\s]+?)\s+End/i)
  if (nameUntilEnd) {
    return nameUntilEnd[1].trim()
  }

  return value.replace(/\s*End\.?:?\s*.*$/i, '').trim()
}

function cleanStudentName(raw: string): string {
  return raw
    .replace(/\d{6,}\s*$/, '')
    .trim()
    .replace(/\s{2,}/g, ' ')
}

function extractPhone(raw: string): string {
  const phonePattern = /\(?\d{2,3}\)?\s*\d{4,5}[-.\s]?\d{4}/g
  const matches = raw.match(phonePattern)
  if (matches) {
    return matches[0].replace(/\D/g, '')
  }
  return raw.replace(/\D/g, '')
}

function validateAndCleanStudent(data: Partial<PDFStudentData>): PDFStudentData {
  const name = cleanStudentName(data.name || '')
  const responsible = extractResponsibleName(data.responsible || '')
  const className = (data.class || '').trim()
  const phone1 = extractPhone(data.phone1 || '')
  const phone2Raw = extractPhone(data.phone2 || '')
  const phone2 = phone2Raw && phone2Raw.length >= 10 ? phone2Raw : null

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

  if (!phone1 || phone1.length < 10) {
    needsReview = true
    reviewReasons.push('Fone 1 inválido')
  }

  return {
    name,
    responsible,
    class: className,
    phone1,
    phone2,
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
            if (value === undefined || value === null) return
            const strValue = String(value).trim()
            if (!strValue) return
            if (field === 'responsible') {
              rawData.responsible = strValue
              return
            }
            if ((rawData as Record<string, unknown>)[field] === undefined) {
              (rawData as Record<string, unknown>)[field] = strValue
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

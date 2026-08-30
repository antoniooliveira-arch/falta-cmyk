// Client-side PDF parser - calls API route
import { PDFStudentData } from '@/types/database'

export type { PDFStudentData }

export async function parsePDF(file: File): Promise<PDFStudentData[]> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/pdf-parse', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao processar o PDF')
    }

    return data.students
  } catch (error) {
    console.error('Error parsing PDF:', error)
    throw new Error('Falha ao processar o PDF')
  }
}
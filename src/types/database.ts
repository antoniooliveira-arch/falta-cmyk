export type School = {
  id: string
  name: string
  code: string
  password_hash: string
  active: boolean
  created_at: string
  updated_at: string
}

export type Student = {
  id: string
  school_id: string
  name: string
  responsible: string
  class: string
  phone1: string
  phone2: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export type Absence = {
  id: string
  student_id: string
  school_id: string
  absence_date: string
  observation: string | null
  registered_by: string
  status: 'REGISTRADA' | 'ENVIADA' | 'VISUALIZADA' | 'CANCELADA'
  created_at: string
  updated_at: string
  students?: Student
  schools?: School
}

export type SchoolUser = {
  id: string
  school_id: string
  user_id: string
  created_at: string
  schools?: School
  users?: { email: string }
}

export type UserRole = 'school' | 'admin'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  school_id?: string
  school_name?: string
}

export type PDFStudentData = {
  name: string
  responsible: string
  class: string
  phone1: string
  phone2: string | null
  needs_review: boolean
  review_reason?: string
}

// For partial school data (used in selects)
export type SchoolBasic = Pick<School, 'id' | 'name'>
export type StudentBasic = Pick<Student, 'id' | 'name' | 'responsible' | 'class' | 'phone1' | 'phone2' | 'school_id'>
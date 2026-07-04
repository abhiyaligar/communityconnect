export type UserRole =
  | "community_admin"
  | "local_admin"
  | "verified_adult"
  | "minor"
  | "unverified"

export type Gender = "male" | "female" | "other"
export type MaritalStatus = "single" | "married" | "divorced" | "widowed"
export type VerificationStatus =
  | "pending"
  | "local_approved"
  | "local_rejected"
  | "approved"
  | "rejected"
  | "escalated"

export interface AuthUser {
  id: string
  role: UserRole
  full_name: string
  username?: string
  date_of_birth: string
  gender: Gender
  marital_status: MaritalStatus
  profile_photo_url?: string
  contact_number: string
  address?: string
  occupation?: string
  social_links?: {
    linkedin?: string
    instagram?: string
    facebook?: string
    twitter?: string
  }
  matrimony?: {
    opted_in: boolean
    double_approval_required?: boolean
    family_co_approver_profile_id?: string | null
    family_co_approver_name?: string | null
    family_co_approver_username?: string | null
    family_co_approver_approved?: boolean
    height_cm?: string
    body_type?: string
    complexion?: string
    highest_qualification?: string
    field_of_study?: string
    institution?: string
    employment_type?: string
    job_title?: string
    income_range?: string
    work_location?: string
    gotra?: string
    rashi?: string
    nakshatra?: string
    manglik_status?: string
    birth_time?: string
    birth_place?: string
    father_name?: string
    father_occupation?: string
    mother_name?: string
    mother_occupation?: string
    brothers_count?: string
    brothers_marital_status?: string
    sisters_count?: string
    sisters_marital_status?: string
    family_type?: string
    family_values?: string
    family_financial_status?: string
    diet?: string
    smoking?: string
    drinking?: string
    physical_activity?: string
    about_me?: string
    hobbies: string[]
    languages: string[]
    additional_photos: string[]
    visibility: string
  }
  wards?: Array<{
    profile_id: string
    full_name: string
    username: string
    gender: string
    approved: boolean
  }>
}

export interface TokenResponse {
  access_token: string
  registered: boolean
  role: UserRole
  user_id: string
}

export interface VerificationRequest {
  request_id: string
  user_id: string
  status: VerificationStatus
  escalated: boolean
  escalation_reason?: string
  created_at: string
  profile?: {
    full_name?: string
    date_of_birth?: string
    gender?: string
    profile_photo_url?: string
    contact_number?: string
    address?: string
    occupation?: string
  }
  matrimony?: {
    opted_in: boolean
    height_cm?: number
    employment_type?: string
    gotra?: string
    highest_qualification?: string
  }
}

export interface AdminDashboardStats {
  total_users: number
  verified_users: number
  pending_verifications: number
  matrimony_opt_ins: number
}

export interface UserProfile {
  profile_id: string
  user_id?: string
  full_name: string
  username?: string
  date_of_birth: string
  gender: Gender
  marital_status: MaritalStatus
  profile_photo_url?: string
  contact_number: string
  address?: string
  occupation?: string
  is_memorial: boolean
  user?: {
    role: UserRole
    is_active: boolean
    phone_number: string
  }
}
export interface MatrimonyEntry {
  profile_id: string
  about_me?: string
  hobbies?: string[]
  languages?: string[]
  connection_status?: string
  connection_request_id?: string | null
  profile?: {
    full_name?: string
    date_of_birth?: string
    gender?: string
    marital_status?: string
    profile_photo_url?: string
    contact_number?: string
    address?: string
    occupation?: string
    username?: string
  }
  matrimony_details?: {
    height_cm?: string
    body_type?: string
    complexion?: string
    highest_qualification?: string
    field_of_study?: string
    institution?: string
    employment_type?: string
    job_title?: string
    income_range?: string
    work_location?: string
    gotra?: string
    rashi?: string
    nakshatra?: string
    manglik_status?: string
    diet?: string
    smoking?: string
    drinking?: string
    physical_activity?: string
    father_name?: string
    father_occupation?: string
    mother_name?: string
    mother_occupation?: string
    brothers_count?: string
    brothers_marital_status?: string
    sisters_count?: string
    sisters_marital_status?: string
    family_type?: string
    family_values?: string
    family_financial_status?: string
    additional_photos?: string[]
  }
}

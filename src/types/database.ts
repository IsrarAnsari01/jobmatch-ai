export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          resume_url: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          resume_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          resume_url?: string | null
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      resume_insights: {
        Row: {
          id: string
          user_id: string
          raw_text: string
          skills: string[]
          experience_years: number | null  // stored as numeric(4,1) — supports 4.5
          job_titles: string[]
          target_roles: string[]
          education: Json
          summary: string | null
          keywords: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          raw_text: string
          skills?: string[]
          experience_years?: number | null
          job_titles?: string[]
          target_roles?: string[]
          education?: Json
          summary?: string | null
          keywords?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          raw_text?: string
          skills?: string[]
          experience_years?: number | null
          job_titles?: string[]
          target_roles?: string[]
          education?: Json
          summary?: string | null
          keywords?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          id: string
          title: string
          company: string
          location: string | null
          description: string
          url: string
          hr_email: string | null
          platform: string
          scraped_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          company: string
          location?: string | null
          description: string
          url: string
          hr_email?: string | null
          platform?: string
          scraped_at?: string
          created_at?: string
        }
        Update: {
          hr_email?: string | null
          scraped_at?: string
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          id: string
          user_id: string
          job_listing_id: string
          score: number
          match_reasons: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_listing_id: string
          score: number
          match_reasons?: string[]
          created_at?: string
        }
        Update: {
          score?: number
          match_reasons?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sent_applications: {
        Row: {
          id: string
          user_id: string
          job_listing_id: string
          sent_at: string
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          job_listing_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_applications_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ResumeInsights = Database['public']['Tables']['resume_insights']['Row']
export type JobListing = Database['public']['Tables']['job_listings']['Row']
export type JobMatch = Database['public']['Tables']['job_matches']['Row']
export type SentApplication = Database['public']['Tables']['sent_applications']['Row']

export interface JobMatchWithListing extends JobMatch {
  job_listings: JobListing
}

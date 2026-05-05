export type DonorStatus = 'current' | 'recently_lapsed' | 'long_lapsed' | 'non_donor'

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}

export type MemberTier =
  | 'shooting_star'
  | 'rising_star'
  | 'morning_star'
  | 'evening_star'
  | 'red_giant'
  | 'blue_giant'
  | 'none'

export interface Donor {
  id: string
  formal_name: string
  informal_first_name: string | null
  email: string | null
  phone: string | null
  employer: string | null
  address: string | null
  donor_notes: string | null
  historical_lifetime_giving: number
  historical_donation_count: number
  starred: boolean
  star_note: string | null
  deceased: boolean
  created_at: string
  updated_at: string
}

export interface Donation {
  id: string
  donor_id: string
  amount: number
  date: string
  type: 'one-time' | 'recurring' | 'grant' | 'in-kind'
  donation_notes: string | null
  created_at: string
}

export interface DonorList {
  id: string
  name: string
  created_at: string
  donor_count?: number
}

export interface DonorWithStats extends Donor {
  donations: Donation[]
  current_year_total: number
  lifetime_total: number
  last_gift_amount: number | null
  last_gift_date: string | null
  total_donation_count: number
  status: DonorStatus
  tier: MemberTier
  tags: Tag[]
}

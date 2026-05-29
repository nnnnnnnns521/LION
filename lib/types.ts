export interface PredictionAnswers {
  q1_disappear?: string
  q2_embarrassing?: string
  q3_headline?: string
  q4_ice_cream_cost?: number
  q5_ai_parenting?: number
  q6_side_hustle?: string
  q7_at_80?: string
  q7_at_80_other?: string
  q8_belief?: string
}

export interface PredictionResponse {
  id: string
  answers: PredictionAnswers
  timestamp: string
  guestNumber?: number
}

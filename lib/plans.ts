/** Maps marketing pricing cards to backend plan slugs */
export const PLAN_SLUG_BY_NAME: Record<string, string> = {
  Starter: 'starter',
  Professional: 'professional',
  Enterprise: 'enterprise',
}

export const DEFAULT_PLAN_SLUG = 'professional'

export function resolvePlanSlug(plan?: string | null): string {
  if (!plan) return DEFAULT_PLAN_SLUG
  const key = plan.trim().toLowerCase()
  const aliases: Record<string, string> = {
    starter: 'starter',
    professional: 'professional',
    enterprise: 'enterprise',
    'basic-plus': 'basic-plus',
    'basicplus': 'basic-plus',
    'basic plus': 'basic-plus',
    trial: 'basic-plus',
  }
  return aliases[key] || PLAN_SLUG_BY_NAME[plan] || key
}

export type PlanSummary = {
  planName: string
  planSlug: string
  startDate: string
  expiryDate: string
  startDateFormatted: string
  expiryDateFormatted: string
  totalCost: number
  currency: string
  durationMonths: number
}

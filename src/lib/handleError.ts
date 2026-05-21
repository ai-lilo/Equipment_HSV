import { toast } from 'sonner'

export function handleSupabaseError(error: { message: string; status?: number } | null, context?: string) {
  if (!error) return

  const isAuthError =
    error.message?.toLowerCase().includes('jwt') ||
    error.message?.toLowerCase().includes('session') ||
    error.status === 401 ||
    error.status === 403

  if (isAuthError) {
    toast.error('Sitzung abgelaufen – bitte neu anmelden.', { duration: 5000 })
    setTimeout(() => window.location.reload(), 2500)
    return
  }

  const prefix = context ? `${context}: ` : ''
  toast.error(`${prefix}${error.message}`)
}

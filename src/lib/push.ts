import { supabase } from './supabase'

export async function subscribeToPush(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const sub = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  })

  await supabase
    .from('users')
    .update({ push_subscription: JSON.stringify(sub) })
    .eq('id', userId)
}

export async function sendDefectNotification(equipmentName: string) {
  await supabase.functions.invoke('send-push', {
    body: { type: 'DEFECT', equipmentName },
  })
}

export async function sendRepairedNotification(equipmentName: string) {
  await supabase.functions.invoke('send-push', {
    body: { type: 'REPAIRED', equipmentName },
  })
}

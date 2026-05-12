self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'HSV Pegnitz'
  const body = data.body ?? ''
  event.waitUntil(
    self.registration.showNotification(title, { body, icon: '/Equipment_HSV/paw.svg' })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/Equipment_HSV/'))
})

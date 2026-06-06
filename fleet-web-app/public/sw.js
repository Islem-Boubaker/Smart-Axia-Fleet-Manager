self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "New notification", body: event.data.text() };
  }

  const title   = payload.title ?? "Smart AXIA Fleet";
  const options = {
    body:    payload.body   ?? "",
    icon:    payload.icon   ?? "/images/app-icon.png",
    badge:   payload.badge  ?? "/images/app-icon.png",
    data:    payload.data   ?? {},
    tag:     payload.data?.notificationId ?? "axia-notification",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data      = event.notification.data ?? {};
  const actionUrl = data.actionUrl;
  const entityType = data.entityType;
  const entityId   = data.entityId;

  let targetPath = "/";
  if (actionUrl) {
    targetPath = actionUrl;
  } else if (entityType === "trip" && entityId) {
    targetPath = `/trips?tripId=${entityId}`;
  } else if (entityType === "maintenance" && entityId) {
    targetPath = `/maintenance/${entityId}`;
  }

  const origin = self.location.origin;
  const targetUrl = origin + targetPath;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(origin) && "focus" in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});

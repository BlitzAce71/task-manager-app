// Service Worker registration and management

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
)

export function register() {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href)
    if (publicUrl.origin !== window.location.origin) {
      return
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`

      if (isLocalhost) {
        checkValidServiceWorker(swUrl)
        navigator.serviceWorker.ready.then(() => {
          console.log('This web app is being served cache-first by a service worker.')
        })
      } else {
        registerValidSW(swUrl)
      }
    })
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('SW registered: ', registration)
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing
        if (installingWorker == null) {
          return
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('New content is available; please refresh.')
              
              // Show update notification
              showUpdateNotification(registration)
            } else {
              console.log('Content is cached for offline use.')
            }
          }
        }
      }
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error)
    })
}

function checkValidServiceWorker(swUrl: string) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type')
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload()
          })
        })
      } else {
        registerValidSW(swUrl)
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.')
    })
}

function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Create a simple notification for updates
  const notification = document.createElement('div')
  notification.id = 'sw-update-notification'
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4F46E5;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 300px;
    font-family: system-ui, -apple-system, sans-serif;
  `
  
  notification.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: 600;">
      Update Available
    </div>
    <div style="margin-bottom: 12px; font-size: 14px;">
      A new version of the app is available.
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="sw-update-btn" style="
        background: white;
        color: #4F46E5;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      ">
        Update
      </button>
      <button id="sw-dismiss-btn" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">
        Later
      </button>
    </div>
  `
  
  document.body.appendChild(notification)
  
  // Handle update button click
  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  })
  
  // Handle dismiss button click
  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    notification.remove()
  })
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('sw-update-notification')) {
      notification.remove()
    }
  }, 10000)
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}
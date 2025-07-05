import { useState, useEffect } from 'react'
import { isOnline, onNetworkChange } from '../utils/networkUtils'

export function useNetworkStatus() {
  const [online, setOnline] = useState(isOnline())
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const cleanup = onNetworkChange((isOnline) => {
      if (!isOnline) {
        setWasOffline(true)
      }
      setOnline(isOnline)
    })

    return cleanup
  }, [])

  return {
    online,
    offline: !online,
    justCameOnline: online && wasOffline,
    resetJustCameOnline: () => setWasOffline(false)
  }
}
import { supabase } from '../lib/supabase'
import { logger } from './logger'

/**
 * Recovery utilities for handling stuck authentication and loading states
 */

export const recovery = {
  /**
   * Clear all local storage and force refresh
   */
  clearLocalStorageAndRefresh(): void {
    logger.warn('Clearing local storage and refreshing page')
    try {
      // Clear all local storage
      localStorage.clear()
      
      // Clear session storage as well
      sessionStorage.clear()
      
      // Force a hard refresh
      window.location.reload()
    } catch (error) {
      logger.error('Failed to clear storage', error)
      // Fallback: just refresh
      window.location.reload()
    }
  },

  /**
   * Force sign out and clear auth state
   */
  async forceSignOut(): Promise<void> {
    logger.warn('Force signing out user')
    try {
      await supabase.auth.signOut()
      
      // Clear any auth-related localStorage keys
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('supabase')) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Refresh to auth page
      window.location.href = '/'
    } catch (error) {
      logger.error('Failed to force sign out', error)
      this.clearLocalStorageAndRefresh()
    }
  },

  /**
   * Check if the app is in a stuck state and needs recovery
   */
  checkForStuckState(): boolean {
    const lastLoadTime = localStorage.getItem('app-last-load-time')
    const currentTime = Date.now()
    
    if (lastLoadTime) {
      const timeDiff = currentTime - parseInt(lastLoadTime)
      // If the app was stuck loading for more than 5 minutes, consider it stuck
      if (timeDiff > 5 * 60 * 1000) {
        logger.warn('App appears to have been stuck, triggering recovery')
        return true
      }
    }
    
    // Update the load time
    localStorage.setItem('app-last-load-time', currentTime.toString())
    return false
  },

  /**
   * Reset real-time subscriptions by refreshing the page
   */
  resetRealtimeConnections(): void {
    logger.warn('Resetting real-time connections')
    // Store a flag to indicate we're recovering
    sessionStorage.setItem('realtime-recovery', 'true')
    window.location.reload()
  },

  /**
   * Check if we're in recovery mode
   */
  isInRecoveryMode(): boolean {
    return sessionStorage.getItem('realtime-recovery') === 'true'
  },

  /**
   * Clear recovery mode flag
   */
  clearRecoveryMode(): void {
    sessionStorage.removeItem('realtime-recovery')
  },

  /**
   * Get app health status
   */
  getAppHealthStatus() {
    const status = {
      hasAuth: !!localStorage.getItem('supabase.auth.token'),
      hasRecentActivity: this.hasRecentActivity(),
      isInRecovery: this.isInRecoveryMode(),
      lastLoadTime: localStorage.getItem('app-last-load-time'),
    }
    
    logger.debug('App health status', status)
    return status
  },

  /**
   * Check if there's been recent user activity
   */
  hasRecentActivity(): boolean {
    const lastActivity = localStorage.getItem('last-user-activity')
    if (!lastActivity) return false
    
    const timeDiff = Date.now() - parseInt(lastActivity)
    return timeDiff < 30 * 60 * 1000 // 30 minutes
  },

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    localStorage.setItem('last-user-activity', Date.now().toString())
  },
}

// Auto-check for stuck state on module load
if (typeof window !== 'undefined') {
  if (recovery.checkForStuckState()) {
    // Don't immediately clear - give the app a chance to load normally first
    setTimeout(() => {
      const healthStatus = recovery.getAppHealthStatus()
      if (!healthStatus.hasRecentActivity) {
        logger.warn('App appears stuck with no recent activity, initiating recovery')
        recovery.clearLocalStorageAndRefresh()
      }
    }, 10000) // Wait 10 seconds before auto-recovery
  }
}
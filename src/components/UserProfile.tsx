import { useAuth } from '../contexts/AuthContext'

export function UserProfile() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-white font-medium">{user?.email}</span>
      </div>
      <button 
        onClick={handleSignOut} 
        className="bg-white/20 text-white border-2 border-white/30 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-white/30 hover:border-white/50 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-white/25"
      >
        Sign Out
      </button>
    </div>
  )
}
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
    <div className="user-profile">
      <div className="user-info">
        <span className="user-email">{user?.email}</span>
      </div>
      <button onClick={handleSignOut} className="sign-out-button">
        Sign Out
      </button>
    </div>
  )
}
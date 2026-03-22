import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback((credentialResponse) => {
    // @react-oauth/google의 useGoogleLogin (토큰 플로우) 콜백
    const { access_token } = credentialResponse
    sessionStorage.setItem('gAccessToken', access_token)

    // Google UserInfo 엔드포인트로 프로필 조회
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then((r) => r.json())
      .then((profile) => {
        setUser({
          name:    profile.name,
          email:   profile.email,
          picture: profile.picture,
          token:   access_token,
        })
      })
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('gAccessToken')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

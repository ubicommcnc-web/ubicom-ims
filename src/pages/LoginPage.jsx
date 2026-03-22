import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import { GOOGLE_CONFIG } from '../config/google'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const googleLogin = useGoogleLogin({
    onSuccess: login,
    onError:   (e) => console.error('로그인 오류:', e),
    scope:     GOOGLE_CONFIG.scopes,
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#1e40af]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <svg viewBox="0 0 40 40" className="w-10 h-10 text-blue-700" fill="currentColor">
              <rect x="4" y="8" width="32" height="6" rx="2" />
              <rect x="4" y="17" width="32" height="6" rx="2" />
              <rect x="4" y="26" width="20" height="6" rx="2" />
              <circle cx="32" cy="29" r="6" fill="#3B82F6" />
              <path d="M29 29l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UBICOM IMS</h1>
          <p className="text-sm text-gray-500 mt-1">IT 네트워크 장비 재고관리 시스템</p>
        </div>

        <button
          onClick={() => googleLogin()}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-medium text-gray-700"
        >
          {/* Google SVG 로고 */}
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google 계정으로 로그인
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          유비콤 팀원만 접근 가능합니다
        </p>
      </div>
    </div>
  )
}

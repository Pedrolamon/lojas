import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role?: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token with backend
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login', {
        email,
        password
      })

      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error) {
      throw new Error('Login failed')
    }
  }

  const register = async (name: string, email: string, password: string, role = 'client') => {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        name,
        email,
        password,
        role
      })

      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(userData)
    } catch (error) {
      throw new Error('Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    isLoading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

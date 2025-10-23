import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError('Credenciais inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  return (<div className='bg-gray-900'>
    <div className="flex items-center justify-center min-h-screen bg-linear-to-b from-gray-900 to-gray-100 p-4">
    <Card className="w-full max-w-md shadow-xl border border-gray-200">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-semibold text-gray-800">Login</CardTitle>
        <CardDescription className="text-gray-500">
          Entre na sua conta para acessar o sistema
        </CardDescription>
      </CardHeader>
  
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
  
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
  
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
              {error}
            </div>
          )}
  
          <Button
            type="submit"
            className="w-full py-2 text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div> 
  </div> 
  )
}

export default Login

import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface CashRegister {
  id: string
  userId: string
  openedAt: string
  closedAt?: string
  initialAmount: number
  expectedAmount?: number
  actualAmount?: number
  status: string
  user: {
    id: string
    name: string
    email: string
  }
  movements: CashMovement[]
}

interface CashMovement {
  id: string
  cashRegisterId: string
  type: string
  amount: number
  description?: string
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

const CashRegister: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'open' | 'manage' | 'close' | 'reports'>('open')
  const [users, setUsers] = useState<User[]>([])
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [selectedUserId, setSelectedUserId] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalDescription, setWithdrawalDescription] = useState('')
  const [actualAmount, setActualAmount] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users')
      setUsers(response.data)
    } catch (error) {
      setError('Erro ao carregar usuários')
    }
  }

  const fetchCurrentRegister = async (userId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/cash-register/current/${userId}`)
      setCurrentRegister(response.data)
    } catch (error) {
      setCurrentRegister(null)
    }
  }

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await axios.post('http://localhost:3001/api/cash-register/open', {
        userId: selectedUserId,
        initialAmount: parseFloat(initialAmount)
      })

      setCurrentRegister(response.data)
      setSuccess('Caixa aberto com sucesso!')
      setActiveTab('manage')
      setInitialAmount('')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao abrir caixa')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentRegister) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await axios.post('http://localhost:3001/api/cash-register/withdrawal', {
        cashRegisterId: currentRegister.id,
        amount: parseFloat(withdrawalAmount),
        description: withdrawalDescription || 'Sangria'
      })

      setCurrentRegister(response.data.cashRegister)
      setSuccess('Sangria realizada com sucesso!')
      setWithdrawalAmount('')
      setWithdrawalDescription('')
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao realizar sangria')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentRegister) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await axios.post('http://localhost:3001/api/cash-register/close', {
        cashRegisterId: currentRegister.id,
        actualAmount: parseFloat(actualAmount)
      })

      setCurrentRegister(null)
      setSuccess('Caixa fechado com sucesso!')
      setActiveTab('open')
      setActualAmount('')
      alert(`Relatório de fechamento:\nDiferença: R$ ${response.data.report.difference.toFixed(2)}`)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao fechar caixa')
    } finally {
      setLoading(false)
    }
  }

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId)
    if (userId) {
      fetchCurrentRegister(userId)
    } else {
      setCurrentRegister(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Controle de Caixa</h1>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'open'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Abrir Caixa
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'manage'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Gerenciar Caixa
          </button>
          <button
            onClick={() => setActiveTab('close')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'close'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Fechar Caixa
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'reports'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Relatórios
          </button>
        </nav>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Open Register Tab */}
      {activeTab === 'open' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Abrir Caixa</h2>
          <form onSubmit={handleOpenRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operador
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um operador</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            {currentRegister && (
              <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                <strong>Atenção:</strong> Este operador já possui um caixa aberto.
                Valor inicial: R$ {currentRegister.initialAmount.toFixed(2)}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Inicial (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
                disabled={!!currentRegister}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!currentRegister}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </button>
          </form>
        </div>
      )}

      {/* Manage Register Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Current Register Info */}
          {currentRegister && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Caixa Atual</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Operador</div>
                  <div className="font-semibold">{currentRegister.user.name}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Valor Inicial</div>
                  <div className="font-semibold">R$ {currentRegister.initialAmount.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600">Valor Esperado</div>
                  <div className="font-semibold">
                    R$ {(currentRegister.expectedAmount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Movements History */}
              <h3 className="text-lg font-semibold mb-4">Movimentações</h3>
              <div className="space-y-2">
                {currentRegister.movements.map(movement => (
                  <div key={movement.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">
                        {movement.type === 'withdrawal' ? 'Sangria' : movement.type}
                      </div>
                      <div className="text-sm text-gray-600">
                        {movement.description} - {new Date(movement.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      movement.amount < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      R$ {movement.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawal Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Realizar Sangria</h2>
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Sangria (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={withdrawalDescription}
                  onChange={(e) => setWithdrawalDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Motivo da sangria"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !currentRegister}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Processando...' : 'Realizar Sangria'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Close Register Tab */}
      {activeTab === 'close' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Fechar Caixa</h2>

          {currentRegister ? (
            <form onSubmit={handleCloseRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Valor Inicial</div>
                  <div className="font-semibold">R$ {currentRegister.initialAmount.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Valor Esperado</div>
                  <div className="font-semibold">
                    R$ {(currentRegister.expectedAmount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Real em Caixa (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Fechando...' : 'Fechar Caixa'}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Nenhum caixa aberto encontrado.</p>
              <button
                onClick={() => setActiveTab('open')}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Abrir Caixa
              </button>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Relatórios de Movimentação</h2>
          <p className="text-gray-600">Funcionalidade de relatórios será implementada em breve.</p>
        </div>
      )}
    </div>
  )
}

export default CashRegister

import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
  address?: string
  birthDate?: string
  loyaltyPoints: number
  creditLimit: number
  currentDebt: number
  isActive: boolean
  sales: Sale[]
  creditTransactions: CreditTransaction[]
  loyaltyTransactions: LoyaltyTransaction[]
}

interface Sale {
  id: string
  total: number
  createdAt: string
  items: SaleItem[]
}

interface SaleItem {
  product: {
    name: string
  }
  quantity: number
  unitPrice: number
}

interface CreditTransaction {
  id: string
  type: string
  amount: number
  description?: string
  dueDate?: string
  status: string
  createdAt: string
}

interface LoyaltyTransaction {
  id: string
  type: string
  points: number
  description?: string
  createdAt: string
}

const CustomerManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'credit' | 'loyalty'>('list')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    birthDate: '',
    creditLimit: ''
  })

  const [creditForm, setCreditForm] = useState({
    amount: '',
    description: '',
    dueDate: ''
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: ''
  })

  const [loyaltyForm, setLoyaltyForm] = useState({
    points: '',
    description: ''
  })

  useEffect(() => {
    if (activeTab === 'list') {
      fetchCustomers()
    }
  }, [activeTab])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3001/api/customers')
      setCustomers(response.data)
    } catch (error) {
      setError('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post('http://localhost:3001/api/customers', {
        ...customerForm,
        creditLimit: parseFloat(customerForm.creditLimit) || 0
      })

      setSuccess('Cliente criado com sucesso!')
      setCustomerForm({
        name: '',
        email: '',
        phone: '',
        document: '',
        address: '',
        birthDate: '',
        creditLimit: ''
      })
      setActiveTab('list')
      fetchCustomers()
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao criar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleCreditSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post(`http://localhost:3001/api/customers/${selectedCustomer.id}/credit/sale`, {
        amount: parseFloat(creditForm.amount),
        description: creditForm.description,
        dueDate: creditForm.dueDate || null
      })

      setSuccess('Venda a prazo registrada com sucesso!')
      setCreditForm({ amount: '', description: '', dueDate: '' })
      fetchCustomers()
      // Refresh selected customer data
      const updatedCustomer = customers.find(c => c.id === selectedCustomer.id)
      if (updatedCustomer) setSelectedCustomer(updatedCustomer)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao registrar venda')
    } finally {
      setLoading(false)
    }
  }

  const handleCreditPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post(`http://localhost:3001/api/customers/${selectedCustomer.id}/credit/payment`, {
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description
      })

      setSuccess('Pagamento registrado com sucesso!')
      setPaymentForm({ amount: '', description: '' })
      fetchCustomers()
      // Refresh selected customer data
      const updatedCustomer = customers.find(c => c.id === selectedCustomer.id)
      if (updatedCustomer) setSelectedCustomer(updatedCustomer)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao registrar pagamento')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeemPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post(`http://localhost:3001/api/customers/${selectedCustomer.id}/loyalty/redeem`, {
        points: parseInt(loyaltyForm.points),
        description: loyaltyForm.description
      })

      setSuccess('Pontos resgatados com sucesso!')
      setLoyaltyForm({ points: '', description: '' })
      fetchCustomers()
      // Refresh selected customer data
      const updatedCustomer = customers.find(c => c.id === selectedCustomer.id)
      if (updatedCustomer) setSelectedCustomer(updatedCustomer)
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao resgatar pontos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestão de Clientes</h1>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Lista de Clientes
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'add'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Adicionar Cliente
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'credit'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Controle de Crédito
          </button>
          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'loyalty'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Programa de Fidelidade
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

      {/* Customer List Tab */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Clientes Cadastrados</h2>

            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="grid gap-4">
                {customers.map(customer => (
                  <div key={customer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{customer.name}</h3>
                        <p className="text-gray-600">{customer.email}</p>
                        <p className="text-gray-600">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Pontos: {customer.loyaltyPoints}</div>
                        <div className="text-sm text-gray-600">Dívida: R$ {customer.currentDebt.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Limite: R$ {customer.creditLimit.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setActiveTab('credit')
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Ver Crédito
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setActiveTab('loyalty')
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Ver Fidelidade
                      </button>
                      <button
                        className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                      >
                        Histórico ({customer.sales.length})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Customer Tab */}
      {activeTab === 'add' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Adicionar Novo Cliente</h2>
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  value={customerForm.document}
                  onChange={(e) => setCustomerForm({...customerForm, document: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={customerForm.birthDate}
                  onChange={(e) => setCustomerForm({...customerForm, birthDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Crédito (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customerForm.creditLimit}
                  onChange={(e) => setCustomerForm({...customerForm, creditLimit: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Cliente'}
            </button>
          </form>
        </div>
      )}

      {/* Credit Control Tab */}
      {activeTab === 'credit' && (
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Controle de Crédito</h2>

            {!selectedCustomer ? (
              <div>
                <p className="mb-4">Selecione um cliente:</p>
                <div className="grid gap-2">
                  {customers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="p-3 text-left border border-gray-200 rounded hover:bg-gray-50"
                    >
                      {customer.name} - Dívida: R$ {customer.currentDebt.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Trocar Cliente
                  </button>
                </div>

                {/* Credit Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Limite de Crédito</div>
                    <div className="font-semibold">R$ {selectedCustomer.creditLimit.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-sm text-gray-600">Dívida Atual</div>
                    <div className="font-semibold">R$ {selectedCustomer.currentDebt.toFixed(2)}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Crédito Disponível</div>
                    <div className="font-semibold">
                      R$ {(selectedCustomer.creditLimit - selectedCustomer.currentDebt).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Credit Transactions */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Transações de Crédito</h4>
                  <div className="space-y-2">
                    {selectedCustomer.creditTransactions.map(transaction => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">
                            {transaction.type === 'sale' ? 'Venda a prazo' : 'Pagamento'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {transaction.description} - {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.amount < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          R$ {transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credit Sale Form */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">Registrar Venda a Prazo</h4>
                    <form onSubmit={handleCreditSale} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={creditForm.amount}
                          onChange={(e) => setCreditForm({...creditForm, amount: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={creditForm.description}
                          onChange={(e) => setCreditForm({...creditForm, description: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Vencimento
                        </label>
                        <input
                          type="date"
                          value={creditForm.dueDate}
                          onChange={(e) => setCreditForm({...creditForm, dueDate: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        {loading ? 'Registrando...' : 'Registrar Venda'}
                      </button>
                    </form>
                  </div>

                  {/* Payment Form */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">Registrar Pagamento</h4>
                    <form onSubmit={handleCreditPayment} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Valor do Pagamento (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={paymentForm.description}
                          onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        {loading ? 'Registrando...' : 'Registrar Pagamento'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loyalty Program Tab */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Programa de Fidelidade</h2>

            {!selectedCustomer ? (
              <div>
                <p className="mb-4">Selecione um cliente:</p>
                <div className="grid gap-2">
                  {customers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="p-3 text-left border border-gray-200 rounded hover:bg-gray-50"
                    >
                      {customer.name} - Pontos: {customer.loyaltyPoints}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">{selectedCustomer.name}</h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Trocar Cliente
                  </button>
                </div>

                {/* Loyalty Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-gray-600">Pontos Atuais</div>
                    <div className="font-semibold text-2xl">{selectedCustomer.loyaltyPoints}</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-gray-600">Valor Estimado</div>
                    <div className="font-semibold">R$ {(selectedCustomer.loyaltyPoints * 0.01).toFixed(2)}</div>
                  </div>
                </div>

                {/* Loyalty Transactions */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">Histórico de Pontos</h4>
                  <div className="space-y-2">
                    {selectedCustomer.loyaltyTransactions.map(transaction => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">
                            {transaction.type === 'earned' ? 'Pontos Ganhos' : 'Pontos Resgatados'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {transaction.description} - {new Date(transaction.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points} pontos
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redeem Points Form */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold mb-4">Resgatar Pontos</h4>
                  <form onSubmit={handleRedeemPoints} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade de Pontos
                      </label>
                      <input
                        type="number"
                        value={loyaltyForm.points}
                        onChange={(e) => setLoyaltyForm({...loyaltyForm, points: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        required
                        max={selectedCustomer.loyaltyPoints}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={loyaltyForm.description}
                        onChange={(e) => setLoyaltyForm({...loyaltyForm, description: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || selectedCustomer.loyaltyPoints === 0}
                      className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      {loading ? 'Resgatando...' : 'Resgatar Pontos'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerManagement

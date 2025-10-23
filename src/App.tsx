import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Register from './components/Register'
import ProductList from './components/ProductList'
import Reports from './components/Reports'
import PDV from './components/PDV'
import CashRegister from './components/CashRegister'
import CustomerManagement from './components/CustomerManagement'
import SupplierManagement from './components/SupplierManagement'
import FinancialManagement from './components/FinancialManagement'
import UserManagement from './components/UserManagement'
import SystemManagement from './components/SystemManagement'
import InstallmentManagement from './components/InstallmentManagement'
import axios from 'axios'

function AppContent() {
  const { user, logout, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    lowStockItems: 0
  })

  useEffect(() => {
    if (activeTab === 'dashboard' && user) {
      fetchDashboardStats()
    }
  }, [activeTab, user])

  const fetchDashboardStats = async () => {
    try {
      const [productsRes, salesRes, lowStockRes] = await Promise.all([
        axios.get('http://localhost:3001/api/products'),
        axios.get('http://localhost:3001/api/reports/sales'),
        axios.get('http://localhost:3001/api/products/low-stock')
      ])

      setStats({
        totalProducts: productsRes.data.length,
        totalSales: salesRes.data.totalSales || 0,
        totalRevenue: salesRes.data.totalRevenue || 0,
        lowStockItems: lowStockRes.data.length
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  // Permission check functions
  const hasPermission = (requiredRoles: string[]) => {
    return user && requiredRoles.includes(user.role)
  }

  const canAccessPDV = hasPermission(['admin', 'manager', 'seller'])
  const canAccessProducts = hasPermission(['admin', 'manager', 'seller'])
  const canAccessReports = hasPermission(['admin', 'manager'])
  const canAccessCashRegister = hasPermission(['admin', 'manager', 'seller'])
  const canAccessCustomers = hasPermission(['admin', 'manager', 'seller', 'client'])
  const canAccessSuppliers = hasPermission(['admin', 'manager'])
  const canAccessFinancial = hasPermission(['admin', 'manager'])
  const canAccessInstallments = hasPermission(['admin', 'manager'])
  const canAccessUsers = hasPermission(['admin'])
  const canAccessSystem = hasPermission(['admin'])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center pt-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setAuthMode('login')}
              className={`px-4 py-2 rounded-md ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`px-4 py-2 rounded-md ${
                authMode === 'register'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Registrar
            </button>
          </div>
        </div>
        {authMode === 'login' ? <Login /> : <Register />}
      </div>
    )
  }

  const Dashboard = () => (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard - Sistema de Gestão</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Itens com Estoque Baixo</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canAccessPDV && (
            <button
              onClick={() => setActiveTab('pdv')}
              className="flex items-center p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <div className="text-left">
                <div className="font-semibold">Nova Venda</div>
                <div className="text-sm opacity-90">Iniciar venda no PDV</div>
              </div>
            </button>
          )}

          {canAccessProducts && (
            <button
              onClick={() => setActiveTab('products')}
              className="flex items-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div className="text-left">
                <div className="font-semibold">Gerenciar Produtos</div>
                <div className="text-sm opacity-90">Adicionar/editar produtos</div>
              </div>
            </button>
          )}

          {canAccessReports && (
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-left">
                <div className="font-semibold">Relatórios</div>
                <div className="text-sm opacity-90">Ver analytics e relatórios</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Atividades Recentes</h2>
        <div className="space-y-4">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-4"></div>
            <div className="flex-1">
              <p className="font-medium">Sistema inicializado</p>
              <p className="text-sm text-gray-600">Todas as funcionalidades estão ativas</p>
            </div>
            <span className="text-sm text-gray-500">Agora</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Lojas Inventory</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Olá, {user.name}</span>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                {user.role === 'admin' ? 'Administrador' :
                 user.role === 'manager' ? 'Gerente' :
                 user.role === 'seller' ? 'Vendedor' : 'Cliente'}
              </span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            {canAccessPDV && (
              <button
                onClick={() => setActiveTab('pdv')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pdv'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                PDV
              </button>
            )}
            {canAccessProducts && (
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Produtos
              </button>
            )}
            {canAccessReports && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Relatórios
              </button>
            )}
            {canAccessCashRegister && (
              <button
                onClick={() => setActiveTab('cash-register')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cash-register'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Controle de Caixa
              </button>
            )}
            {canAccessCustomers && (
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clientes
              </button>
            )}
            {canAccessSuppliers && (
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'suppliers'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Fornecedores
              </button>
            )}
            {canAccessFinancial && (
              <button
                onClick={() => setActiveTab('financial')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'financial'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Financeiro
              </button>
            )}
            {canAccessInstallments && (
              <button
                onClick={() => setActiveTab('installments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'installments'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Parcelamentos
              </button>
            )}
            {canAccessUsers && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Usuários
              </button>
            )}
            {canAccessSystem && (
              <button
                onClick={() => setActiveTab('system')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sistema
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'products' && canAccessProducts && <ProductList />}
          {activeTab === 'pdv' && canAccessPDV && <PDV />}
          {activeTab === 'inventory' && <div>Inventory Component</div>}
          {activeTab === 'reports' && canAccessReports && <Reports />}
          {activeTab === 'cash-register' && canAccessCashRegister && <CashRegister />}
          {activeTab === 'customers' && canAccessCustomers && <CustomerManagement />}
          {activeTab === 'suppliers' && canAccessSuppliers && <SupplierManagement />}
          {activeTab === 'financial' && canAccessFinancial && <FinancialManagement />}
          {activeTab === 'installments' && canAccessInstallments && <InstallmentManagement />}
          {activeTab === 'users' && canAccessUsers && <UserManagement />}
          {activeTab === 'system' && canAccessSystem && <SystemManagement />}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

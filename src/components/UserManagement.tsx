import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  commissionType: string
  commissionValue: number
  canCancelSales: boolean
  canRefundSales: boolean
  createdAt: string
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'seller',
    commissionType: 'percentage',
    commissionValue: 0,
    canCancelSales: false,
    canRefundSales: false
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingUser) {
        await axios.put(`http://localhost:3001/api/users/${editingUser.id}`, formData)
      } else {
        await axios.post('http://localhost:3001/api/users', formData)
      }
      fetchUsers()
      resetForm()
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Erro ao salvar usuário')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      commissionType: user.commissionType,
      commissionValue: user.commissionValue,
      canCancelSales: user.canCancelSales,
      canRefundSales: user.canRefundSales
    })
    setShowForm(true)
  }

  const handleDelete = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await axios.delete(`http://localhost:3001/api/users/${userId}`)
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Erro ao excluir usuário')
      }
    }
  }

  const toggleUserStatus = async (user: User) => {
    try {
      await axios.put(`http://localhost:3001/api/users/${user.id}`, {
        ...user,
        isActive: !user.isActive
      })
      fetchUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'seller',
      commissionType: 'percentage',
      commissionValue: 0,
      canCancelSales: false,
      canRefundSales: false
    })
    setEditingUser(null)
    setShowForm(false)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Gerenciamento de Usuários</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          Novo Usuário
        </button>
      </div>

      {/* User Form */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6">
          <h3 className="text-xl font-semibold mb-4">
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
            </div>

            {!editingUser && (
              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border p-2 rounded"
                  required={!editingUser}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Função</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full border p-2 rounded"
                >
                  <option value="seller">Vendedor</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Comissão</label>
                <select
                  value={formData.commissionType}
                  onChange={(e) => setFormData({...formData, commissionType: e.target.value})}
                  className="w-full border p-2 rounded"
                >
                  <option value="percentage">Percentual</option>
                  <option value="fixed">Valor Fixo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Valor da Comissão ({formData.commissionType === 'percentage' ? '%' : 'R$'})
              </label>
              <input
                type="number"
                value={formData.commissionValue}
                onChange={(e) => setFormData({...formData, commissionValue: parseFloat(e.target.value) || 0})}
                className="w-full border p-2 rounded"
                step="0.01"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canCancelSales}
                  onChange={(e) => setFormData({...formData, canCancelSales: e.target.checked})}
                  className="mr-2"
                />
                Pode cancelar vendas
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.canRefundSales}
                  onChange={(e) => setFormData({...formData, canRefundSales: e.target.checked})}
                  className="mr-2"
                />
                Pode reembolsar vendas
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingUser ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' :
                       user.role === 'manager' ? 'Gerente' : 'Vendedor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.commissionValue > 0 ? (
                        `${user.commissionType === 'percentage' ? user.commissionValue + '%' : 'R$ ' + user.commissionValue.toFixed(2)}`
                      ) : 'Nenhuma'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserManagement

import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Supplier {
  id: string
  name: string
  cnpj?: string
  ie?: string
  cnae?: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  representativeName?: string
  representativePhone?: string
  representativeEmail?: string
  bankName?: string
  bankAccount?: string
  bankAgency?: string
  pixKey?: string
  defaultPaymentTerms?: string
  creditLimit: number
  isActive: boolean
  reliabilityScore: number
  purchaseOrders: PurchaseOrder[]
  reliabilityHistory: ReliabilityHistory[]
}

interface PurchaseOrder {
  id: string
  orderNumber: string
  status: string
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  totalAmount: number
  notes?: string
  items: PurchaseOrderItem[]
}

interface PurchaseOrderItem {
  id: string
  product: {
    name: string
  }
  quantity: number
  unitCost: number
  totalCost: number
  receivedQuantity: number
  status: string
}

interface ReliabilityHistory {
  id: string
  eventType: string
  description?: string
  scoreChange: number
  createdAt: string
}

interface Product {
  id: string
  name: string
  currentStock: number
}

const SupplierManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'orders' | 'reports'>('list')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    cnpj: '',
    ie: '',
    cnae: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    representativeName: '',
    representativePhone: '',
    representativeEmail: '',
    bankName: '',
    bankAccount: '',
    bankAgency: '',
    pixKey: '',
    defaultPaymentTerms: '',
    creditLimit: ''
  })

  const [orderForm, setOrderForm] = useState({
    supplierId: '',
    items: [] as Array<{ productId: string; quantity: number; unitCost: number }>,
    expectedDate: '',
    notes: ''
  })

  useEffect(() => {
    if (activeTab === 'list') {
      fetchSuppliers()
    } else if (activeTab === 'orders') {
      fetchProducts()
    }
  }, [activeTab])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await axios.get('http://localhost:3001/api/suppliers')
      setSuppliers(response.data)
    } catch (error) {
      setError('Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Erro ao carregar produtos')
    }
  }

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post('http://localhost:3001/api/suppliers', {
        ...supplierForm,
        creditLimit: parseFloat(supplierForm.creditLimit) || 0
      })

      setSuccess('Fornecedor criado com sucesso!')
      setSupplierForm({
        name: '',
        cnpj: '',
        ie: '',
        cnae: '',
        email: '',
        phone: '',
        whatsapp: '',
        address: '',
        representativeName: '',
        representativePhone: '',
        representativeEmail: '',
        bankName: '',
        bankAccount: '',
        bankAgency: '',
        pixKey: '',
        defaultPaymentTerms: '',
        creditLimit: ''
      })
      setActiveTab('list')
      fetchSuppliers()
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao criar fornecedor')
    } finally {
      setLoading(false)
    }
  }

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post('http://localhost:3001/api/purchase-orders', {
        supplierId: orderForm.supplierId,
        items: orderForm.items,
        expectedDate: orderForm.expectedDate || null,
        notes: orderForm.notes
      })

      setSuccess('Pedido criado com sucesso!')
      setOrderForm({
        supplierId: '',
        items: [],
        expectedDate: '',
        notes: ''
      })
      fetchSuppliers()
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  const addOrderItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { productId: '', quantity: 1, unitCost: 0 }]
    })
  }

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderForm.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setOrderForm({ ...orderForm, items: updatedItems })
  }

  const removeOrderItem = (index: number) => {
    const updatedItems = orderForm.items.filter((_, i) => i !== index)
    setOrderForm({ ...orderForm, items: updatedItems })
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await axios.put(`http://localhost:3001/api/purchase-orders/${orderId}/status`, {
        status,
        receivedDate: status === 'received' ? new Date().toISOString() : null
      })
      fetchSuppliers()
      setSuccess('Status do pedido atualizado!')
    } catch (error) {
      setError('Erro ao atualizar status do pedido')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestão de Fornecedores</h1>

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
            Lista de Fornecedores
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'add'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Adicionar Fornecedor
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'orders'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pedidos de Compra
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

      {/* Supplier List Tab */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Fornecedores Cadastrados</h2>

            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="grid gap-4">
                {suppliers.map(supplier => (
                  <div key={supplier.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{supplier.name}</h3>
                        <p className="text-gray-600">{supplier.email}</p>
                        <p className="text-gray-600">{supplier.phone}</p>
                        {supplier.cnpj && <p className="text-sm text-gray-500">CNPJ: {supplier.cnpj}</p>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Pontuação: {supplier.reliabilityScore}/100</div>
                        <div className="text-sm text-gray-600">Pedidos: {supplier.purchaseOrders.length}</div>
                        <div className="text-sm text-gray-600">Limite: R$ {supplier.creditLimit.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setActiveTab('orders')
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Ver Pedidos ({supplier.purchaseOrders.length})
                      </button>
                      <button
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Editar
                      </button>
                      <button
                        className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                      >
                        Histórico
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Supplier Tab */}
      {activeTab === 'add' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6">Adicionar Novo Fornecedor</h2>
          <form onSubmit={handleSupplierSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={supplierForm.cnpj}
                  onChange={(e) => setSupplierForm({...supplierForm, cnpj: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={supplierForm.ie}
                  onChange={(e) => setSupplierForm({...supplierForm, ie: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNAE
                </label>
                <input
                  type="text"
                  value={supplierForm.cnae}
                  onChange={(e) => setSupplierForm({...supplierForm, cnae: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={supplierForm.whatsapp}
                  onChange={(e) => setSupplierForm({...supplierForm, whatsapp: e.target.value})}
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
                  value={supplierForm.creditLimit}
                  onChange={(e) => setSupplierForm({...supplierForm, creditLimit: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Representative Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações do Representante</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Representante
                  </label>
                  <input
                    type="text"
                    value={supplierForm.representativeName}
                    onChange={(e) => setSupplierForm({...supplierForm, representativeName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone do Representante
                  </label>
                  <input
                    type="tel"
                    value={supplierForm.representativePhone}
                    onChange={(e) => setSupplierForm({...supplierForm, representativePhone: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email do Representante
                  </label>
                  <input
                    type="email"
                    value={supplierForm.representativeEmail}
                    onChange={(e) => setSupplierForm({...supplierForm, representativeEmail: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Banking Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Informações Bancárias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Banco
                  </label>
                  <input
                    type="text"
                    value={supplierForm.bankName}
                    onChange={(e) => setSupplierForm({...supplierForm, bankName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conta Corrente
                  </label>
                  <input
                    type="text"
                    value={supplierForm.bankAccount}
                    onChange={(e) => setSupplierForm({...supplierForm, bankAccount: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agência
                  </label>
                  <input
                    type="text"
                    value={supplierForm.bankAgency}
                    onChange={(e) => setSupplierForm({...supplierForm, bankAgency: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={supplierForm.pixKey}
                    onChange={(e) => setSupplierForm({...supplierForm, pixKey: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Condições de Pagamento</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condições Padrão de Pagamento
                </label>
                <input
                  type="text"
                  value={supplierForm.defaultPaymentTerms}
                  onChange={(e) => setSupplierForm({...supplierForm, defaultPaymentTerms: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 30/60/90 dias"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Criando...' : 'Criar Fornecedor'}
            </button>
          </form>
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Create Order Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Criar Pedido de Compra</h2>
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <select
                  value={orderForm.supplierId}
                  onChange={(e) => setOrderForm({...orderForm, supplierId: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Selecione um fornecedor</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Itens do Pedido
                  </label>
                  <button
                    type="button"
                    onClick={addOrderItem}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Adicionar Item
                  </button>
                </div>

                <div className="space-y-2">
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="flex space-x-2 items-end">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Selecione um produto</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} (Estoque: {product.currentStock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Qtd"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Custo"
                          value={item.unitCost}
                          onChange={(e) => updateOrderItem(index, 'unitCost', parseFloat(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Esperada de Entrega
                  </label>
                  <input
                    type="date"
                    value={orderForm.expectedDate}
                    onChange={(e) => setOrderForm({...orderForm, expectedDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={loading || orderForm.items.length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Criando...' : 'Criar Pedido'}
              </button>
            </form>
          </div>

          {/* Orders List */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Pedidos de Compra</h2>
            <div className="space-y-4">
              {suppliers.flatMap(supplier =>
                supplier.purchaseOrders.map(order => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Pedido #{order.orderNumber}
                        </h3>
                        <p className="text-gray-600">Fornecedor: {supplier.name}</p>
                        <p className="text-sm text-gray-500">
                          Data: {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                          order.status === 'received' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status === 'received' ? 'Recebido' :
                           order.status === 'pending' ? 'Pendente' :
                           order.status === 'ordered' ? 'Encomendado' : order.status}
                        </div>
                        <p className="text-lg font-semibold mt-1">
                          R$ {order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Itens:</h4>
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.product.name}</span>
                            <span>
                              {item.receivedQuantity}/{item.quantity} x R$ {item.unitCost.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ordered')}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          Marcar como Encomendado
                        </button>
                      )}
                      {order.status === 'ordered' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'received')}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          Marcar como Recebido
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Relatórios de Fornecedores</h2>
            <p className="text-gray-600">Funcionalidade de relatórios será implementada em breve.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierManagement

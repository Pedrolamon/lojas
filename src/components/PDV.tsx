import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface Product {
  id: string
  name: string
  barcode?: string
  sellingPrice: number
  currentStock: number
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  document?: string
}

interface Payment {
  method: string
  amount: number
  change?: number
}

interface MixedPayment {
  method: string
  amount: number
}

const PDV = () => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [barcode, setBarcode] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [mixedPayments, setMixedPayments] = useState<MixedPayment[]>([])
  const [useMixedPayment, setUseMixedPayment] = useState(false)

  const [isLocked, setIsLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);
  const [serviceStartTime, setServiceStartTime] = useState<Date | null>(null)
  const [serviceTime, setServiceTime] = useState(0)
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [showRecentSales, setShowRecentSales] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnSale, setReturnSale] = useState<any>(null)
  const [returnItems, setReturnItems] = useState<any[]>([])
  const [returnReason, setReturnReason] = useState('')

  // Auto-lock functionality
  useEffect(() => {
    const resetTimer = () => {
      if (lockTimer) clearTimeout(lockTimer)
      const timer = setTimeout(() => {
        setIsLocked(true)
      }, 5 * 60 * 1000) // 5 minutes
      setLockTimer(timer)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimer))
      if (lockTimer) clearTimeout(lockTimer)
    }
  }, [lockTimer])

  // Service time tracking
  useEffect(() => {
    if (cart.length > 0 && !serviceStartTime) {
      setServiceStartTime(new Date())
    }

    const interval = setInterval(() => {
      if (serviceStartTime) {
        setServiceTime(Math.floor((new Date().getTime() - serviceStartTime.getTime()) / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [cart, serviceStartTime])

  useEffect(() => {
    fetchCustomers()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users')
      if (response.data.length > 0) {
        setCurrentUserId(response.data[0].id)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customers')
      setCustomers(response.data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const searchProduct = async (searchBarcode: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/products/search/${searchBarcode}`)
      const product = response.data
      addToCart(product)
      setBarcode('')
    } catch (error) {
      alert('Produto não encontrado!')
      console.error('Error searching product:', error)
    }
  }

  const searchProductsByName = async (name: string) => {
    if (name.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const response = await axios.get('http://localhost:3001/api/products')
      const products = response.data.filter((product: Product) =>
        product.name.toLowerCase().includes(name.toLowerCase())
      )
      setSearchResults(products.slice(0, 10)) // Limit to 10 results
      setShowSearchResults(true)
    } catch (error) {
      console.error('Error searching products:', error)
    }
  }

  const fetchRecentSales = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/sales?limit=10')
      setRecentSales(response.data)
      setShowRecentSales(true)
    } catch (error) {
      console.error('Error fetching recent sales:', error)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F1 - Focus on barcode input
      if (e.key === 'F1') {
        e.preventDefault()
        document.getElementById('barcode-input')?.focus()
      }
      // F2 - Finalizar venda
      if (e.key === 'F2' && cart.length > 0) {
        e.preventDefault()
        setShowPayment(true)
      }
      // F3 - Cancel payment
      if (e.key === 'F3' && showPayment) {
        e.preventDefault()
        setShowPayment(false)
      }
      // F4 - Clear cart
      if (e.key === 'F4') {
        e.preventDefault()
        if (window.confirm('Deseja limpar o carrinho?')) {
          setCart([])
          setDiscount(0)
          setSelectedCustomer(null)
        }
      }
      // F5 - Recent sales
      if (e.key === 'F5') {
        e.preventDefault()
        fetchRecentSales()
      }
      // ESC - Close modals
      if (e.key === 'Escape') {
        setShowPayment(false)
        setShowRecentSales(false)
        setShowSearchResults(false)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [cart, showPayment])

  const calculateChange = () => {
    const total = getTotal()
    const payment = parseFloat(paymentAmount) || 0
    return Math.max(0, payment - total)
  }

  const getMixedPaymentTotal = () => {
    return mixedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getRemainingAmount = () => {
    const total = getTotal()
    const paidAmount = useMixedPayment ? getMixedPaymentTotal() : parseFloat(paymentAmount) || 0
    return Math.max(0, total - paidAmount)
  }

  const addMixedPayment = (method: string, amount: number) => {
    if (amount <= 0) return

    const newPayment: MixedPayment = { method, amount }
    setMixedPayments([...mixedPayments, newPayment])
  }

  const removeMixedPayment = (index: number) => {
    setMixedPayments(mixedPayments.filter((_, i) => i !== index))
  }

  const clearMixedPayments = () => {
    setMixedPayments([])
    setUseMixedPayment(false)
  }

  const openReturnModal = (sale: any) => {
    setReturnSale(sale)
    setReturnItems(sale.items.map((item: any) => ({
      ...item,
      returnQuantity: 0,
      maxReturn: item.quantity
    })))
    setReturnReason('')
    setShowReturnModal(true)
  }

  const updateReturnQuantity = (itemId: string, quantity: number) => {
    setReturnItems(returnItems.map(item =>
      item.id === itemId
        ? { ...item, returnQuantity: Math.min(Math.max(0, quantity), item.maxReturn) }
        : item
    ))
  }

  const getReturnTotal = () => {
    return returnItems.reduce((sum, item) => sum + (item.returnQuantity * item.unitPrice), 0)
  }

  const processReturn = async () => {
    if (!returnSale || returnItems.every(item => item.returnQuantity === 0)) {
      alert('Selecione pelo menos um item para devolver!')
      return
    }

    if (!returnReason.trim()) {
      alert('Informe o motivo da devolução!')
      return
    }

    try {
      const returnData = {
        saleId: returnSale.id,
        items: returnItems.filter(item => item.returnQuantity > 0).map(item => ({
          saleItemId: item.id,
          quantity: item.returnQuantity,
          reason: returnReason
        })),
        userId: currentUserId
      }

      await axios.post('http://localhost:3001/api/returns', returnData)

      alert('Devolução processada com sucesso!')
      setShowReturnModal(false)
      setReturnSale(null)
      setReturnItems([])
      setReturnReason('')

      // Refresh recent sales
      fetchRecentSales()
    } catch (error) {
      console.error('Error processing return:', error)
      alert('Erro ao processar devolução!')
    }
  }

  const printReceipt = (sale: any) => {
    const paymentDetails = sale.payments.map((payment: any, index: number) => {
      const methodName = payment.method === 'cash' ? 'Dinheiro' :
                        payment.method === 'credit' ? 'Cartão de Crédito' :
                        payment.method === 'debit' ? 'Cartão de Débito' :
                        payment.method === 'pix' ? 'PIX' : payment.method
      return `${index + 1}. ${methodName}: R$ ${payment.amount.toFixed(2)}${payment.change > 0 ? ` (Troco: R$ ${payment.change.toFixed(2)})` : ''}`
    }).join('\n')

    const totalPaid = sale.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
    const totalChange = sale.payments.reduce((sum: number, payment: any) => sum + (payment.change || 0), 0)

    const receipt = `
======== RECIBO ========
Data: ${new Date(sale.createdAt).toLocaleString('pt-BR')}
Cliente: ${sale.customer?.name || 'Não identificado'}

ITENS:
${sale.items.map((item: any) => `${item.product.name}
  Qtd: ${item.quantity} x R$ ${item.unitPrice.toFixed(2)} = R$ ${item.total.toFixed(2)}`).join('\n')}

Subtotal: R$ ${sale.total.toFixed(2)}
Desconto: R$ ${sale.discount.toFixed(2)}
TOTAL: R$ ${(sale.total - sale.discount).toFixed(2)}

PAGAMENTOS:
${paymentDetails}

Total Pago: R$ ${totalPaid.toFixed(2)}
Troco Total: R$ ${totalChange.toFixed(2)}

Obrigado pela preferência!
    `
    console.log('=== RECIBO PARA IMPRESSÃO ===')
    console.log(receipt)
    alert('Recibo enviado para impressão (ver console)')
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        total: product.sellingPrice
      }
      setCart([...cart, newItem])
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = Math.min(quantity, item.product.currentStock)
        return {
          ...item,
          quantity: newQuantity,
          total: (newQuantity * item.unitPrice) - item.discount
        }
      }
      return item
    }))
  }

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          discount,
          total: (item.quantity * item.unitPrice) - discount
        }
      }
      return item
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0) - discount
  }

  const processPayment = async () => {
    if (cart.length === 0) return

    const total = getTotal()

    try {
      let payments: Payment[] = []

      if (useMixedPayment) {
        // Mixed payments
        const totalPaid = getMixedPaymentTotal()

        if (totalPaid < total) {
          alert('Valor do pagamento insuficiente!')
          return
        }

        // Convert mixed payments to payment array
        payments = mixedPayments.map(payment => ({
          method: payment.method,
          amount: payment.amount,
          change: 0 // No change for individual mixed payments
        }))

        // Calculate change for the last payment (usually cash)
        const change = totalPaid - total
        if (change > 0 && payments.length > 0) {
          payments[payments.length - 1].change = change
        }
      } else {
        // Single payment
        const paymentAmountNum = parseFloat(paymentAmount)

        if (paymentAmountNum < total) {
          alert('Valor do pagamento insuficiente!')
          return
        }

        payments = [{
          method: paymentMethod,
          amount: paymentAmountNum,
          change: paymentAmountNum - total
        }]
      }

      const saleData = {
        customerId: selectedCustomer?.id,
        userId: currentUserId,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount
        })),
        payments,
        discount
      }

      await axios.post('http://localhost:3001/api/sales', saleData)

      const totalChange = payments.reduce((sum, payment) => sum + (payment.change || 0), 0)
      alert(`Venda realizada com sucesso!\nTroco: R$ ${totalChange.toFixed(2)}`)

      // Reset cart and payment state
      setCart([])
      setDiscount(0)
      setPaymentAmount('')
      setShowPayment(false)
      setSelectedCustomer(null)
      clearMixedPayments()

    } catch (error) {
      console.error('Error processing sale:', error)
      alert('Erro ao processar venda!')
    }
  }

  // Lock screen
  if (isLocked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-4">PDV Bloqueado</h2>
          <p className="text-gray-600 mb-6">Sistema bloqueado por inatividade</p>
          <button
            onClick={() => setIsLocked(false)}
            className="bg-blue-500 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold"
          >
            Desbloquear
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">PDV - Ponto de Venda</h2>
        <div className="text-right">
          <div className="text-sm text-gray-600">Tempo de Atendimento</div>
          <div className="text-lg font-semibold text-blue-600">
            {Math.floor(serviceTime / 60)}:{(serviceTime % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Product Search */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded shadow mb-6">
            <h3 className="text-xl font-semibold mb-4">Buscar Produto</h3>

            {/* Barcode Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Código de Barras</label>
              <div className="flex gap-2">
                <input
                  id="barcode-input"
                  type="text"
                  placeholder="Digite o código de barras (F1)"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchProduct(barcode)}
                  className="flex-1 border p-2 rounded"
                />
                <button
                  onClick={() => searchProduct(barcode)}
                  className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Name Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Buscar por Nome</label>
              <input
                type="text"
                placeholder="Digite o nome do produto"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  searchProductsByName(e.target.value)
                }}
                className="w-full border p-2 rounded"
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="mt-2 border rounded max-h-40 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        addToCart(product)
                        setSearchTerm('')
                        setShowSearchResults(false)
                      }}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        Código: {product.barcode} | Preço: R$ {product.sellingPrice.toFixed(2)} | Estoque: {product.currentStock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-gray-50 p-3 rounded text-sm">
              <h4 className="font-semibold mb-2">Atalhos de Teclado:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>F1:</strong> Foco no código</div>
                <div><strong>F2:</strong> Finalizar venda</div>
                <div><strong>F3:</strong> Cancelar pagamento</div>
                <div><strong>F4:</strong> Limpar carrinho</div>
                <div><strong>F5:</strong> Vendas recentes</div>
                <div><strong>ESC:</strong> Fechar modais</div>
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">Carrinho</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500">Carrinho vazio</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.product.name}</h4>
                        <p className="text-sm text-gray-600">Código: {item.product.barcode}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Qtd:</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                              className="w-16 border p-1 rounded text-center"
                              min="1"
                              max={item.product.currentStock}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm">Desc:</label>
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value))}
                              className="w-20 border p-1 rounded text-center"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R$ {item.total.toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700 text-sm mt-1"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Summary & Payment */}
        <div>
          <div className="bg-white p-6 rounded shadow mb-6">
            <h3 className="text-xl font-semibold mb-4">Resumo</h3>

            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Cliente</label>
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value)
                  setSelectedCustomer(customer || null)
                }}
                className="w-full border p-2 rounded"
              >
                <option value="">Cliente não identificado</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {cart.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Desconto:</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 border p-1 rounded text-center"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>R$ {getTotal().toFixed(2)}</span>
              </div>
            </div>

            {!showPayment ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={cart.length === 0}
                  className="w-full bg-green-500 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded font-semibold"
                >
                  Finalizar Venda
                </button>
                <button
                  onClick={fetchRecentSales}
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                >
                  📋 Vendas Recentes (F5)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Payment Type Selection */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setUseMixedPayment(false)
                      clearMixedPayments()
                    }}
                    className={`flex-1 py-2 px-4 rounded font-medium text-sm ${
                      !useMixedPayment
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pagamento Único
                  </button>
                  <button
                    onClick={() => setUseMixedPayment(true)}
                    className={`flex-1 py-2 px-4 rounded font-medium text-sm ${
                      useMixedPayment
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pagamento Misto
                  </button>
                </div>

                {!useMixedPayment ? (
                  // Single Payment
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Forma de Pagamento</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border p-2 rounded"
                      >
                        <option value="cash">Dinheiro</option>
                        <option value="credit">Cartão de Crédito</option>
                        <option value="debit">Cartão de Débito</option>
                        <option value="pix">PIX</option>
                        <option value="credit_sale">Fiado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Valor Recebido</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full border p-2 rounded"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {paymentAmount && parseFloat(paymentAmount) > 0 && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <div className="text-sm">
                            <span className="font-medium">Troco: </span>
                            <span className="text-green-600 font-semibold">
                              R$ {calculateChange().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Mixed Payment
                  <>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold mb-3">Pagamentos</h4>

                      {/* Add Payment Form */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="border p-2 rounded text-sm"
                        >
                          <option value="cash">Dinheiro</option>
                          <option value="credit">Crédito</option>
                          <option value="debit">Débito</option>
                          <option value="pix">PIX</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Valor"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="border p-2 rounded text-sm"
                          step="0.01"
                          min="0"
                        />
                        <button
                          onClick={() => {
                            const amount = parseFloat(paymentAmount)
                            if (amount > 0) {
                              addMixedPayment(paymentMethod, amount)
                              setPaymentAmount('')
                            }
                          }}
                          className="bg-green-500 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                        >
                          Adicionar
                        </button>
                      </div>

                      {/* Payment List */}
                      <div className="space-y-2 mb-3">
                        {mixedPayments.map((payment, index) => (
                          <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="text-sm font-medium">
                              {payment.method === 'cash' ? 'Dinheiro' :
                               payment.method === 'credit' ? 'Cartão de Crédito' :
                               payment.method === 'debit' ? 'Cartão de Débito' :
                               payment.method === 'pix' ? 'PIX' : payment.method}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">R$ {payment.amount.toFixed(2)}</span>
                              <button
                                onClick={() => removeMixedPayment(index)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Total da Venda:</span>
                          <span className="font-semibold">R$ {getTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Total Pago:</span>
                          <span className="font-semibold">R$ {getMixedPaymentTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span>Restante:</span>
                          <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}>
                            R$ {getRemainingAmount().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPayment(false)
                      clearMixedPayments()
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-700 text-white py-2 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={processPayment}
                    disabled={useMixedPayment && getRemainingAmount() > 0}
                    className="flex-1 bg-green-500 hover:bg-green-700 disabled:bg-gray-300 text-white py-2 rounded font-semibold"
                  >
                    {useMixedPayment && getRemainingAmount() > 0 ? 'Valor Insuficiente' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Modal */}
      {showRecentSales && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Vendas Recentes</h3>
              <button
                onClick={() => setShowRecentSales(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-semibold text-lg">
                          Venda #{sale.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(sale.createdAt).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-600">
                          Cliente: {sale.customer?.name || 'Não identificado'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          R$ {sale.total.toFixed(2)}
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                          <button
                            onClick={() => printReceipt(sale)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            🖨️ Imprimir Recibo
                          </button>
                          <button
                            onClick={() => openReturnModal(sale)}
                            className="text-orange-500 hover:text-orange-700 text-sm"
                          >
                            ↩️ Devolver
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {sale.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.product.name}</span>
                          <span>
                            {item.quantity}x R$ {item.unitPrice.toFixed(2)} = R$ {item.total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {sale.discount > 0 && (
                      <div className="text-sm text-red-600 mt-2">
                        Desconto: R$ {sale.discount.toFixed(2)}
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div className="text-sm">
                        <span className="font-medium">Pagamento: </span>
                        {sale.payments[0]?.method === 'cash' ? 'Dinheiro' :
                         sale.payments[0]?.method === 'credit' ? 'Cartão de Crédito' :
                         sale.payments[0]?.method === 'debit' ? 'Cartão de Débito' :
                         sale.payments[0]?.method === 'pix' ? 'PIX' : 'Fiado'}
                      </div>
                      {sale.payments[0]?.change > 0 && (
                        <div className="text-sm text-green-600">
                          Troco: R$ {sale.payments[0].change.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {recentSales.length === 0 && (
                <p className="text-gray-500 text-center py-8">Nenhuma venda recente encontrada</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && returnSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Processar Devolução</h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Sale Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold mb-2">Informações da Venda</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Venda:</span> #{returnSale.id.slice(-8)}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span> {new Date(returnSale.createdAt).toLocaleString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-medium">Cliente:</span> {returnSale.customer?.name || 'Não identificado'}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> R$ {returnSale.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Return Items */}
              <div className="mb-6">
                <h4 className="font-semibold mb-4">Itens para Devolução</h4>
                <div className="space-y-3">
                  {returnItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium">{item.product.name}</h5>
                          <p className="text-sm text-gray-600">
                            Vendido: {item.quantity} x R$ {item.unitPrice.toFixed(2)} = R$ {item.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Devolver:</label>
                            <input
                              type="number"
                              value={item.returnQuantity}
                              onChange={(e) => updateReturnQuantity(item.id, parseInt(e.target.value))}
                              className="w-16 border p-1 rounded text-center"
                              min="0"
                              max={item.maxReturn}
                            />
                            <span className="text-sm text-gray-500">/ {item.maxReturn}</span>
                          </div>
                        </div>
                      </div>
                      {item.returnQuantity > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Valor a ser devolvido: R$ {(item.returnQuantity * item.unitPrice).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold mb-3">Resumo da Devolução</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total de Itens para Devolução:</span>
                    <span className="font-semibold">
                      {returnItems.reduce((sum, item) => sum + item.returnQuantity, 0)} itens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor Total da Devolução:</span>
                    <span className="font-semibold text-green-600">
                      R$ {getReturnTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Return Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Motivo da Devolução *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">Selecione o motivo</option>
                  <option value="Produto com defeito">Produto com defeito</option>
                  <option value="Produto errado">Produto errado</option>
                  <option value="Cliente desistiu">Cliente desistiu</option>
                  <option value="Atraso na entrega">Atraso na entrega</option>
                  <option value="Insatisfação com o produto">Insatisfação com o produto</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-700 text-white py-3 rounded font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={processReturn}
                  disabled={returnItems.every(item => item.returnQuantity === 0) || !returnReason}
                  className="flex-1 bg-orange-500 hover:bg-orange-700 disabled:bg-gray-300 text-white py-3 rounded font-semibold"
                >
                  Processar Devolução
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PDV

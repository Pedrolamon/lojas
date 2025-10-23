import React, { useState, useEffect } from 'react';

interface ExpenseCategory {
  id: string;
  name: string;
  type: 'fixed' | 'variable' | 'investment';
  description?: string;
}

interface CostCenter {
  id: string;
  name: string;
  description?: string;
}

interface FinancialTransaction {
  id: string;
  type: 'payable' | 'receivable' | 'expense' | 'income' | 'payment';
  description: string;
  amount: number;
  dueDate?: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  category?: ExpenseCategory;
  costCenter?: CostCenter;
  supplier?: { id: string; name: string };
  customer?: { id: string; name: string };
  user: { id: string; name: string };
  createdAt: string;
}

interface FinancialAlert {
  overdue: FinancialTransaction[];
  dueThisWeek: FinancialTransaction[];
  totalOverdueAmount: number;
  totalDueThisWeekAmount: number;
}

const FinancialManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [alerts, setAlerts] = useState<FinancialAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', type: 'fixed', description: '' });
  const [newCostCenter, setNewCostCenter] = useState({ name: '', description: '' });
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    description: '',
    amount: '',
    dueDate: '',
    categoryId: '',
    costCenterId: '',
    supplierId: '',
    customerId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, costCentersRes, transactionsRes, alertsRes] = await Promise.all([
        fetch('/api/expense-categories'),
        fetch('/api/cost-centers'),
        fetch('/api/financial-transactions'),
        fetch('/api/alerts/financial')
      ]);

      if (categoriesRes.ok) setExpenseCategories(await categoriesRes.json());
      if (costCentersRes.ok) setCostCenters(await costCentersRes.json());
      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      if (response.ok) {
        setNewCategory({ name: '', type: 'fixed', description: '' });
        setShowForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleCreateCostCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cost-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCostCenter)
      });
      if (response.ok) {
        setNewCostCenter({ name: '', description: '' });
        setShowForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating cost center:', error);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/financial-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount),
          userId: 'admin-user-id' // TODO: Get from auth context
        })
      });
      if (response.ok) {
        setNewTransaction({
          type: 'expense',
          description: '',
          amount: '',
          dueDate: '',
          categoryId: '',
          costCenterId: '',
          supplierId: '',
          customerId: ''
        });
        setShowForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (loading) return <div className="text-center py-8">Carregando...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <p className="text-gray-600">Controle completo das finanças da sua loja</p>
      </div>

      {/* Financial Alerts */}
      {alerts && (alerts.overdue.length > 0 || alerts.dueThisWeek.length > 0) && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              {alerts.overdue.length > 0 && (
                <span className="font-semibold text-red-600">
                  {alerts.overdue.length} contas vencidas ({formatCurrency(alerts.totalOverdueAmount)})
                </span>
              )}
              {alerts.dueThisWeek.length > 0 && (
                <span className="ml-4 font-semibold text-yellow-600">
                  {alerts.dueThisWeek.length} vencem esta semana ({formatCurrency(alerts.totalDueThisWeekAmount)})
                </span>
              )}
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Ver Detalhes
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'transactions', label: 'Transações' },
            { id: 'categories', label: 'Categorias' },
            { id: 'cost-centers', label: 'Centros de Custo' },
            { id: 'reports', label: 'Relatórios' },
            { id: 'delinquency', label: 'Inadimplência' },
            { id: 'forecast', label: 'Previsão' },
            { id: 'recurring', label: 'Lançamentos Recorrentes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contas a Pagar</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(transactions.filter(t => t.type === 'payable' && t.status !== 'paid').reduce((sum, t) => sum + t.amount, 0))}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transactions.filter(t => t.type === 'payable' && t.status === 'overdue').length} vencidas
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contas a Receber</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(transactions.filter(t => t.type === 'receivable' && t.status !== 'paid').reduce((sum, t) => sum + t.amount, 0))}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transactions.filter(t => t.type === 'receivable' && t.status === 'overdue').length} vencidas
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fluxo de Caixa</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      transactions.filter(t => t.type === 'income' || t.type === 'receivable').reduce((sum, t) => sum + t.amount, 0) -
                      transactions.filter(t => t.type === 'expense' || t.type === 'payable').reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Este mês</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Transações Recentes</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Valor</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-2">{transaction.description}</td>
                        <td className="py-2">{transaction.type}</td>
                        <td className="py-2">{formatCurrency(transaction.amount)}</td>
                        <td className="py-2">{getStatusBadge(transaction.status)}</td>
                        <td className="py-2">{new Date(transaction.createdAt).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Transações Financeiras</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {showForm ? 'Cancelar' : 'Nova Transação'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Nova Transação</h3>
              <form onSubmit={handleCreateTransaction}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="expense">Despesa</option>
                      <option value="income">Receita</option>
                      <option value="payable">Conta a Pagar</option>
                      <option value="receivable">Conta a Receber</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                    <input
                      type="date"
                      value={newTransaction.dueDate}
                      onChange={(e) => setNewTransaction({...newTransaction, dueDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={newTransaction.categoryId}
                      onChange={(e) => setNewTransaction({...newTransaction, categoryId: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Selecione uma categoria</option>
                      {expenseCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
                    <select
                      value={newTransaction.costCenterId}
                      onChange={(e) => setNewTransaction({...newTransaction, costCenterId: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Selecione um centro de custo</option>
                      {costCenters.map((center) => (
                        <option key={center.id} value={center.id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Criar Transação
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Categoria</th>
                      <th className="text-left py-2">Centro de Custo</th>
                      <th className="text-left py-2">Valor</th>
                      <th className="text-left py-2">Vencimento</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-2">{transaction.description}</td>
                        <td className="py-2">{transaction.type}</td>
                        <td className="py-2">{transaction.category?.name || '-'}</td>
                        <td className="py-2">{transaction.costCenter?.name || '-'}</td>
                        <td className="py-2">{formatCurrency(transaction.amount)}</td>
                        <td className="py-2">{transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="py-2">{getStatusBadge(transaction.status)}</td>
                        <td className="py-2">
                          <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                              Editar
                            </button>
                            {transaction.status !== 'paid' && (
                              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                                Pagar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Categorias de Despesa</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {showForm ? 'Cancelar' : 'Nova Categoria'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Nova Categoria</h3>
              <form onSubmit={handleCreateCategory}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={newCategory.type}
                      onChange={(e) => setNewCategory({...newCategory, type: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="fixed">Fixa</option>
                      <option value="variable">Variável</option>
                      <option value="investment">Investimento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Criar Categoria
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {expenseCategories.map((category) => (
              <div key={category.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.type === 'fixed' ? 'bg-blue-100 text-blue-800' :
                    category.type === 'variable' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {category.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{category.description}</p>
                <div className="mt-4 flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Editar
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Centers Tab */}
      {activeTab === 'cost-centers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Centros de Custo</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {showForm ? 'Cancelar' : 'Novo Centro'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Novo Centro de Custo</h3>
              <form onSubmit={handleCreateCostCenter}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={newCostCenter.name}
                      onChange={(e) => setNewCostCenter({...newCostCenter, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={newCostCenter.description}
                      onChange={(e) => setNewCostCenter({...newCostCenter, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Criar Centro
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {costCenters.map((center) => (
              <div key={center.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">{center.name}</h3>
                <p className="text-sm text-gray-600">{center.description}</p>
                <div className="mt-4 flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Editar
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Relatórios Financeiros</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Contas a Pagar</h3>
              <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Gerar Relatório
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Contas a Receber</h3>
              <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Gerar Relatório
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
              <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Gerar Relatório
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">DRE (Demonstrativo de Resultados)</h3>
              <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Gerar Relatório
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Ponto de Equilíbrio</h3>
              <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Calcular
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Ticket Médio</h3>
              <div className="text-2xl font-bold text-center">
                {formatCurrency(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) /
                  Math.max(transactions.filter(t => t.type === 'income').length, 1))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Relatório de Inadimplência</h3>
              <button className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Gerar Relatório
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Previsão de Fluxo de Caixa</h3>
              <button className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                Ver Gráficos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delinquency Tab */}
      {activeTab === 'delinquency' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Relatório de Inadimplência</h2>
            <button
              onClick={() => window.open('/api/reports/delinquency', '_blank')}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Gerar Relatório Completo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Total Inadimplente</h3>
              <p className="text-3xl font-bold">
                {formatCurrency(transactions.filter(t => t.status === 'overdue').reduce((sum, t) => sum + t.amount, 0))}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-orange-600 mb-2">Transações Vencidas</h3>
              <p className="text-3xl font-bold">
                {transactions.filter(t => t.status === 'overdue').length}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-blue-600 mb-2">Clientes Inadimplentes</h3>
              <p className="text-3xl font-bold">
                {new Set(transactions.filter(t => t.status === 'overdue' && t.customer).map(t => t.customer?.id)).size}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Transações Vencidas</h3>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Cliente/Fornecedor</th>
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-left py-2">Valor</th>
                      <th className="text-left py-2">Vencimento</th>
                      <th className="text-left py-2">Dias em Atraso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.status === 'overdue').map((transaction) => {
                      const dueDate = new Date(transaction.dueDate || '');
                      const today = new Date();
                      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                      const entityName = transaction.customer?.name || transaction.supplier?.name || 'N/A';

                      return (
                        <tr key={transaction.id} className="border-b">
                          <td className="py-2">{entityName}</td>
                          <td className="py-2">{transaction.description}</td>
                          <td className="py-2">{formatCurrency(transaction.amount)}</td>
                          <td className="py-2">{dueDate.toLocaleDateString('pt-BR')}</td>
                          <td className="py-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              {daysOverdue} dias
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Tab */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Previsão de Fluxo de Caixa</h2>
            <button
              onClick={() => window.open('/api/reports/cash-flow-forecast', '_blank')}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Gerar Previsão Completa
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Previsão para os Próximos 6 Meses</h3>
            <div className="space-y-4">
              {/* Mock forecast data - in real implementation, this would come from the API */}
              {[
                { month: 'Janeiro 2025', inflows: 15000, outflows: 12000, netCashFlow: 3000, cumulative: 3000 },
                { month: 'Fevereiro 2025', inflows: 18000, outflows: 14000, netCashFlow: 4000, cumulative: 7000 },
                { month: 'Março 2025', inflows: 16000, outflows: 13000, netCashFlow: 3000, cumulative: 10000 },
                { month: 'Abril 2025', inflows: 20000, outflows: 15000, netCashFlow: 5000, cumulative: 15000 },
                { month: 'Maio 2025', inflows: 17000, outflows: 16000, netCashFlow: 1000, cumulative: 16000 },
                { month: 'Junho 2025', inflows: 19000, outflows: 14000, netCashFlow: 5000, cumulative: 21000 }
              ].map((forecast, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{forecast.month}</h4>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>Entradas: {formatCurrency(forecast.inflows)}</span>
                      <span>Saídas: {formatCurrency(forecast.outflows)}</span>
                      <span>Saldo: {formatCurrency(forecast.netCashFlow)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${forecast.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(forecast.cumulative)}
                    </p>
                    <p className="text-xs text-gray-500">Acumulado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Resumo da Previsão</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Projetado Entradas:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(105000)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Projetado Saídas:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(84000)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Saldo Projetado:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(21000)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Alertas de Previsão</h3>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">Fluxo de caixa positivo projetado</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">Crescimento consistente esperado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Tab */}
      {activeTab === 'recurring' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Lançamentos Recorrentes</h2>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Novo Lançamento
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-center text-gray-500 py-8">
              Funcionalidade de lançamentos recorrentes em desenvolvimento
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

interface Product {
  id: string
  name: string
  barcode?: string
  photo?: string
  costPrice: number
  sellingPrice: number
  location?: string
  expirationDate?: string
  minStock: number
  currentStock: number
  averageCost?: number
  investedValue?: number
  lastSaleDate?: string
}

const Reports = () => {
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [stagnant, setStagnant] = useState<Product[]>([])
  const [expiring, setExpiring] = useState<Product[]>([])
  const [salesReport, setSalesReport] = useState<any>(null)
  const [salesByPeriod, setSalesByPeriod] = useState<any[]>([])
  const [profitAnalysis, setProfitAnalysis] = useState<any>(null)
  const [stagnantEnhanced, setStagnantEnhanced] = useState<any>(null)
  const [commissionReport, setCommissionReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const [
        lowStockRes,
        stagnantRes,
        expiringRes,
        salesRes,
        salesByPeriodRes,
        profitRes,
        stagnantEnhancedRes,
        commissionRes
      ] = await Promise.all([
        axios.get('http://localhost:3001/api/products/low-stock'),
        axios.get('http://localhost:3001/api/products/stagnant'),
        axios.get('http://localhost:3001/api/products/expiring'),
        axios.get('http://localhost:3001/api/reports/sales'),
        axios.get('http://localhost:3001/api/reports/sales-by-period?period=day&days=30'),
        axios.get('http://localhost:3001/api/reports/profit-analysis'),
        axios.get('http://localhost:3001/api/reports/stagnant-enhanced'),
        axios.get('http://localhost:3001/api/reports/commissions')
      ])

      setLowStock(lowStockRes.data)
      setStagnant(stagnantRes.data)
      setExpiring(expiringRes.data)
      setSalesReport(salesRes.data)
      setSalesByPeriod(salesByPeriodRes.data)
      setProfitAnalysis(profitRes.data)
      setStagnantEnhanced(stagnantEnhancedRes.data)
      setCommissionReport(commissionRes.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) return <div className="text-center py-8">Loading reports...</div>

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Reports & Analytics</h2>

      {/* Tab Navigation */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex space-x-4 border-b">
          {['overview', 'sales', 'profit', 'inventory', 'commissions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'sales' && '💰 Sales'}
              {tab === 'profit' && '📈 Profit'}
              {tab === 'inventory' && '📦 Inventory'}
              {tab === 'commissions' && '💵 Commissions'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-blue-600">{salesReport?.totalSales || 0}</div>
              <div className="text-sm text-gray-600">Total Sales</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-green-600">R$ {salesReport?.totalRevenue?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-purple-600">R$ {salesReport?.averageTicket?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Average Ticket</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-red-600">{lowStock.length}</div>
              <div className="text-sm text-gray-600">Low Stock Items</div>
            </div>
          </div>

          {/* Sales by Period Chart */}
          {salesByPeriod.length > 0 && (
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-xl font-semibold mb-4">📈 Sales Trend (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Alerts Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Low Stock Alert */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4 text-red-600">⚠️ Low Stock Alert</h3>
              {lowStock.length === 0 ? (
                <p className="text-green-600 text-sm">All products are above minimum stock levels.</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.slice(0, 3).map((product) => (
                    <div key={product.id} className="border border-red-200 p-3 rounded">
                      <div className="font-medium text-red-800 text-sm">{product.name}</div>
                      <div className="text-xs text-gray-600">Stock: {product.currentStock}/{product.minStock}</div>
                    </div>
                  ))}
                  {lowStock.length > 3 && (
                    <p className="text-xs text-gray-500">+{lowStock.length - 3} more items</p>
                  )}
                </div>
              )}
            </div>

            {/* Stagnant Products */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4 text-yellow-600">📦 Stagnant Products</h3>
              {stagnant.length === 0 ? (
                <p className="text-green-600 text-sm">No stagnant products found.</p>
              ) : (
                <div className="space-y-2">
                  {stagnant.slice(0, 3).map((product) => (
                    <div key={product.id} className="border border-yellow-200 p-3 rounded">
                      <div className="font-medium text-yellow-800 text-sm">{product.name}</div>
                      <div className="text-xs text-gray-600">Value: R$ {product.investedValue?.toFixed(2) || '0.00'}</div>
                    </div>
                  ))}
                  {stagnant.length > 3 && (
                    <p className="text-xs text-gray-500">+{stagnant.length - 3} more items</p>
                  )}
                </div>
              )}
            </div>

            {/* Expiring Products */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">⏰ Expiring Soon</h3>
              {expiring.length === 0 ? (
                <p className="text-green-600 text-sm">No products expiring soon.</p>
              ) : (
                <div className="space-y-2">
                  {expiring.slice(0, 3).map((product) => (
                    <div key={product.id} className="border border-orange-200 p-3 rounded">
                      <div className="font-medium text-orange-800 text-sm">{product.name}</div>
                      <div className="text-xs text-gray-600">
                        Expires: {product.expirationDate ? new Date(product.expirationDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                  {expiring.length > 3 && (
                    <p className="text-xs text-gray-500">+{expiring.length - 3} more items</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && salesReport && (
        <div className="space-y-6">
          {/* Sales Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-blue-600">{salesReport.totalSales}</div>
              <div className="text-sm text-gray-600">Total Sales</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-green-600">R$ {salesReport.totalRevenue?.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-purple-600">R$ {salesReport.averageTicket?.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Average Ticket</div>
            </div>
          </div>

          {/* Sales Trend Chart */}
          {salesByPeriod.length > 0 && (
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-xl font-semibold mb-4">📈 Daily Sales Trend</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesByPeriod}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`R$ ${value}`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Products */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">🏆 Top Products by Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesReport.topProducts?.slice(0, 10) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Profit Tab */}
      {activeTab === 'profit' && profitAnalysis && (
        <div className="space-y-6">
          {/* Profit Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-green-600">R$ {profitAnalysis.summary?.totalRevenue?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-red-600">R$ {profitAnalysis.summary?.totalCostOfGoods?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Cost of Goods</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-blue-600">R$ {profitAnalysis.summary?.grossProfit?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Gross Profit</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-purple-600">{profitAnalysis.summary?.grossMargin?.toFixed(1) || '0'}%</div>
              <div className="text-sm text-gray-600">Gross Margin</div>
            </div>
          </div>

          {/* Top Profitable Products */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">💰 Top Profitable Products</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profitAnalysis.topProfitableProducts?.slice(0, 10) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Profit']} />
                <Bar dataKey="profit" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && stagnantEnhanced && (
        <div className="space-y-6">
          {/* Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-red-600">{stagnantEnhanced.totalStagnantProducts}</div>
              <div className="text-sm text-gray-600">Stagnant Products</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-yellow-600">R$ {stagnantEnhanced.totalStagnantValue?.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Stagnant Value</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-orange-600">{expiring.length}</div>
              <div className="text-sm text-gray-600">Expiring Soon</div>
            </div>
          </div>

          {/* Stagnant Products by Category */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">📦 Stagnant Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stagnantEnhanced.stagnantByCategory || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, count }) => `${category}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(stagnantEnhanced.stagnantByCategory || []).map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Stagnant Products */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">📋 Detailed Stagnant Products</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Stagnant
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stagnantEnhanced.products?.slice(0, 10).map((product: any) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.currentStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {product.investedValue?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.daysStagnant || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && commissionReport && (
        <div className="space-y-6">
          {/* Commission Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-green-600">R$ {commissionReport.summary?.totalCommissions?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Total Commissions</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-blue-600">R$ {commissionReport.summary?.paidCommissions?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Paid Commissions</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-orange-600">R$ {commissionReport.summary?.pendingCommissions?.toFixed(2) || '0.00'}</div>
              <div className="text-sm text-gray-600">Pending Commissions</div>
            </div>
          </div>

          {/* Commissions by User */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">👥 Commissions by User</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={commissionReport.commissionsByUser || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="userName" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${value}`, 'Amount']} />
                <Legend />
                <Bar dataKey="totalCommissions" stackId="a" fill="#8884d8" />
                <Bar dataKey="paidCommissions" stackId="a" fill="#82ca9d" />
                <Bar dataKey="pendingCommissions" stackId="a" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Commissions */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">📋 Recent Commissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissionReport.commissions?.slice(0, 10).map((commission: any) => (
                    <tr key={commission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{commission.userName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {commission.saleTotal?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ {commission.commissionAmount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          commission.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(commission.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports

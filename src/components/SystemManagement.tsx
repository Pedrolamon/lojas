import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface BackupInfo {
  totalBackups: number
  latestBackup: string | null
  totalSize: number
}



const SystemManagement = () => {
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [backups, setBackups] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [cashHistory, setCashHistory] = useState<any[]>([])
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('backup')

  useEffect(() => {
    loadBackupInfo()
  }, [])

  const loadBackupInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/backup/list')
      setBackups(response.data.backups)
      setBackupInfo(response.data.info)
    } catch (error) {
      console.error('Error loading backup info:', error)
    }
  }

  const createBackup = async () => {
    setLoading(true)
    try {
      await axios.post('http://localhost:3001/api/backup/create')
      await loadBackupInfo()
      alert('Backup criado com sucesso!')
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('Erro ao criar backup')
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = async (filename: string) => {
    if (!window.confirm(`Tem certeza que deseja restaurar o backup ${filename}? Isso irá substituir os dados atuais.`)) {
      return
    }

    setLoading(true)
    try {
      await axios.post(`http://localhost:3001/api/backup/restore/${filename}`)
      alert('Backup restaurado com sucesso! A aplicação será recarregada.')
      window.location.reload()
    } catch (error) {
      console.error('Error restoring backup:', error)
      alert('Erro ao restaurar backup')
    } finally {
      setLoading(false)
    }
  }

  const cleanupBackups = async () => {
    setLoading(true)
    try {
      await axios.post('http://localhost:3001/api/backup/cleanup')
      await loadBackupInfo()
      alert('Backups antigos limpos com sucesso!')
    } catch (error) {
      console.error('Error cleaning up backups:', error)
      alert('Erro ao limpar backups')
    } finally {
      setLoading(false)
    }
  }

  const loadCashHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/history/cash-movements?limit=50')
      setCashHistory(response.data)
    } catch (error) {
      console.error('Error loading cash history:', error)
    }
  }

  const loadStockHistory = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/history/stock-movements?limit=50')
      setStockHistory(response.data)
    } catch (error) {
      console.error('Error loading stock history:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Gerenciamento do Sistema</h2>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex space-x-4 border-b">
          {['backup', 'cash-history', 'stock-history'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                if (tab === 'cash-history') loadCashHistory()
                if (tab === 'stock-history') loadStockHistory()
              }}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'backup' && '💾 Backup'}
              {tab === 'cash-history' && '💰 Histórico do Caixa'}
              {tab === 'stock-history' && '📦 Histórico do Estoque'}
            </button>
          ))}
        </div>
      </div>

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Backup Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-blue-600">{backupInfo?.totalBackups || 0}</div>
              <div className="text-sm text-gray-600">Total de Backups</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-green-600">
                {backupInfo?.totalSize ? formatFileSize(backupInfo.totalSize) : '0 Bytes'}
              </div>
              <div className="text-sm text-gray-600">Espaço Utilizado</div>
            </div>
            <div className="bg-white p-6 rounded shadow text-center">
              <div className="text-3xl font-bold text-purple-600">
                {backupInfo?.latestBackup ? new Date(backupInfo.latestBackup.replace('backup-', '').replace('.db', '').replace(/-/g, ':')).toLocaleDateString('pt-BR') : 'Nenhum'}
              </div>
              <div className="text-sm text-gray-600">Último Backup</div>
            </div>
          </div>

          {/* Backup Actions */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">Ações de Backup</h3>
            <div className="flex gap-4">
              <button
                onClick={createBackup}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Backup'}
              </button>
              <button
                onClick={cleanupBackups}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
              >
                {loading ? 'Limpando...' : 'Limpar Backups Antigos'}
              </button>
            </div>
          </div>

          {/* Backup List */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">Backups Disponíveis</h3>
            <div className="space-y-2">
              {backups.length === 0 ? (
                <p className="text-gray-500">Nenhum backup encontrado</p>
              ) : (
                backups.map((backup) => (
                  <div key={backup} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">{backup}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(backup.replace('backup-', '').replace('.db', '').replace(/-/g, ':')).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <button
                      onClick={() => restoreBackup(backup)}
                      disabled={loading}
                      className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Restaurar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cash History Tab */}
      {activeTab === 'cash-history' && (
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl font-semibold mb-4">Histórico de Movimentações do Caixa</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operador
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cashHistory.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(movement.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movement.type === 'withdrawal'
                          ? 'bg-red-100 text-red-800'
                          : movement.type === 'deposit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {movement.type === 'withdrawal' ? 'Sangria' :
                         movement.type === 'deposit' ? 'Depósito' : 'Venda'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {Math.abs(movement.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.cashRegister?.user?.name || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {cashHistory.length === 0 && (
            <p className="text-gray-500 text-center py-8">Nenhuma movimentação encontrada</p>
          )}
        </div>
      )}

      {/* Stock History Tab */}
      {activeTab === 'stock-history' && (
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl font-semibold mb-4">Histórico de Movimentações do Estoque</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo Unitário
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stockHistory.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.product?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'entry'
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'sale'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'entry' ? 'Entrada' :
                         transaction.type === 'sale' ? 'Venda' : 'Perda'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.unitCost ? `R$ ${transaction.unitCost.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stockHistory.length === 0 && (
            <p className="text-gray-500 text-center py-8">Nenhuma movimentação encontrada</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SystemManagement

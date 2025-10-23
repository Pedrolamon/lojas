import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CalendarIcon, DollarSign, Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  numberOfInstallments: number;
  installmentAmount: number;
  startDate: string;
  customerId?: string;
  supplierId?: string;
  customer?: { id: string; name: string };
  supplier?: { id: string; name: string };
  transactions: Transaction[];
  summary?: {
    totalAmount: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    remainingAmount: number;
    paidInstallments: number;
    pendingInstallments: number;
    overdueInstallments: number;
  };
}

interface Transaction {
  id: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface CostCenter {
  id: string;
  name: string;
}

const InstallmentManagement: React.FC = () => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    numberOfInstallments: '',
    startDate: new Date(),
    entityType: 'customer' as 'customer' | 'supplier',
    entityId: '',
    categoryId: '',
    costCenterId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [installmentsRes, customersRes, suppliersRes, categoriesRes, costCentersRes] = await Promise.all([
        fetch('/api/installments'),
        fetch('/api/customers'),
        fetch('/api/suppliers'),
        fetch('/api/expense-categories'),
        fetch('/api/cost-centers')
      ]);

      const [installmentsData, customersData, suppliersData, categoriesData, costCentersData] = await Promise.all([
        installmentsRes.json(),
        customersRes.json(),
        suppliersRes.json(),
        categoriesRes.json(),
        costCentersRes.json()
      ]);

      setInstallments(installmentsData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
      setCategories(categoriesData);
      setCostCenters(costCentersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstallment = async () => {
    try {
      const data: any = {
        description: formData.description,
        totalAmount: parseFloat(formData.totalAmount),
        numberOfInstallments: parseInt(formData.numberOfInstallments),
        startDate: formData.startDate.toISOString(),
        categoryId: formData.categoryId,
        costCenterId: formData.costCenterId,
        userId: 'user-id' // TODO: Get from auth context
      };

      if (formData.entityType === 'customer') {
        data.customerId = formData.entityId;
      } else {
        data.supplierId = formData.entityId;
      }

      const response = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchData();
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating installment:', error);
    }
  };

  const handleDeleteInstallment = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este parcelamento?')) return;

    try {
      const response = await fetch(`/api/installments/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting installment:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      totalAmount: '',
      numberOfInstallments: '',
      startDate: new Date(),
      entityType: 'customer',
      entityId: '',
      categoryId: '',
      costCenterId: ''
    });
  };

  const filteredInstallments = installments.filter(installment =>
    installment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    installment.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    installment.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Parcelamentos</h1>
          <p className="text-muted-foreground">
            Gerencie parcelamentos de contas a receber e a pagar
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Parcelamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Parcelamento</DialogTitle>
              <DialogDescription>
                Configure os detalhes do parcelamento
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="col-span-3"
                  placeholder="Descrição do parcelamento"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="totalAmount" className="text-right">
                  Valor Total
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numberOfInstallments" className="text-right">
                  N° Parcelas
                </Label>
                <Input
                  id="numberOfInstallments"
                  type="number"
                  value={formData.numberOfInstallments}
                  onChange={(e) => setFormData({...formData, numberOfInstallments: e.target.value})}
                  className="col-span-3"
                  placeholder="Número de parcelas"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Data Inicial
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData({...formData, startDate: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entityType" className="text-right">
                  Tipo
                </Label>
                <Select value={formData.entityType} onValueChange={(value: 'customer' | 'supplier') => setFormData({...formData, entityType: value, entityId: ''})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Cliente (A Receber)</SelectItem>
                    <SelectItem value="supplier">Fornecedor (A Pagar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entity" className="text-right">
                  {formData.entityType === 'customer' ? 'Cliente' : 'Fornecedor'}
                </Label>
                <Select value={formData.entityId} onValueChange={(value) => setFormData({...formData, entityId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={`Selecione ${formData.entityType === 'customer' ? 'o cliente' : 'o fornecedor'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.entityType === 'customer' ? customers : suppliers).map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoria
                </Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({...formData, categoryId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="costCenter" className="text-right">
                  Centro de Custo
                </Label>
                <Select value={formData.costCenterId} onValueChange={(value) => setFormData({...formData, costCenterId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((costCenter) => (
                      <SelectItem key={costCenter.id} value={costCenter.id}>
                        {costCenter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateInstallment}>
                Criar Parcelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar parcelamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="receivable">A Receber</TabsTrigger>
          <TabsTrigger value="payable">A Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parcelamentos</CardTitle>
              <CardDescription>
                Lista de todos os parcelamentos cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Valor Parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell className="font-medium">
                        {installment.description}
                      </TableCell>
                      <TableCell>
                        {installment.customer?.name || installment.supplier?.name}
                      </TableCell>
                      <TableCell>{formatCurrency(installment.totalAmount)}</TableCell>
                      <TableCell>{installment.numberOfInstallments}x</TableCell>
                      <TableCell>{formatCurrency(installment.installmentAmount)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {installment.summary && (
                            <>
                              {installment.summary.paidInstallments > 0 && (
                                <Badge variant="default" className="bg-green-500">
                                  {installment.summary.paidInstallments} pagas
                                </Badge>
                              )}
                              {installment.summary.pendingInstallments > 0 && (
                                <Badge variant="secondary">
                                  {installment.summary.pendingInstallments} pendentes
                                </Badge>
                              )}
                              {installment.summary.overdueInstallments > 0 && (
                                <Badge variant="destructive">
                                  {installment.summary.overdueInstallments} vencidas
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInstallment(installment);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInstallment(installment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parcelamentos a Receber</CardTitle>
              <CardDescription>
                Parcelamentos de clientes (contas a receber)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Valor Parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments
                    .filter(installment => installment.customerId)
                    .map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">
                          {installment.customer?.name}
                        </TableCell>
                        <TableCell>{installment.description}</TableCell>
                        <TableCell>{formatCurrency(installment.totalAmount)}</TableCell>
                        <TableCell>{installment.numberOfInstallments}x</TableCell>
                        <TableCell>{formatCurrency(installment.installmentAmount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {installment.summary && (
                              <>
                                {installment.summary.paidInstallments > 0 && (
                                  <Badge variant="default" className="bg-green-500">
                                    {installment.summary.paidInstallments} pagas
                                  </Badge>
                                )}
                                {installment.summary.pendingInstallments > 0 && (
                                  <Badge variant="secondary">
                                    {installment.summary.pendingInstallments} pendentes
                                  </Badge>
                                )}
                                {installment.summary.overdueInstallments > 0 && (
                                  <Badge variant="destructive">
                                    {installment.summary.overdueInstallments} vencidas
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInstallment(installment);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInstallment(installment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parcelamentos a Pagar</CardTitle>
              <CardDescription>
                Parcelamentos de fornecedores (contas a pagar)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Parcelas</TableHead>
                    <TableHead>Valor Parcela</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments
                    .filter(installment => installment.supplierId)
                    .map((installment) => (
                      <TableRow key={installment.id}>
                        <TableCell className="font-medium">
                          {installment.supplier?.name}
                        </TableCell>
                        <TableCell>{installment.description}</TableCell>
                        <TableCell>{formatCurrency(installment.totalAmount)}</TableCell>
                        <TableCell>{installment.numberOfInstallments}x</TableCell>
                        <TableCell>{formatCurrency(installment.installmentAmount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {installment.summary && (
                              <>
                                {installment.summary.paidInstallments > 0 && (
                                  <Badge variant="default" className="bg-green-500">
                                    {installment.summary.paidInstallments} pagas
                                  </Badge>
                                )}
                                {installment.summary.pendingInstallments > 0 && (
                                  <Badge variant="secondary">
                                    {installment.summary.pendingInstallments} pendentes
                                  </Badge>
                                )}
                                {installment.summary.overdueInstallments > 0 && (
                                  <Badge variant="destructive">
                                    {installment.summary.overdueInstallments} vencidas
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInstallment(installment);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInstallment(installment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Installment Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Parcelamento</DialogTitle>
            <DialogDescription>
              {selectedInstallment?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedInstallment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Entidade</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedInstallment.customer?.name || selectedInstallment.supplier?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Total</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedInstallment.totalAmount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Número de Parcelas</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedInstallment.numberOfInstallments}x
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor da Parcela</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedInstallment.installmentAmount)}
                  </p>
                </div>
              </div>

              {selectedInstallment.summary && (
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium">Pago</p>
                          <p className="text-2xl font-bold text-green-500">
                            {formatCurrency(selectedInstallment.summary.totalPaid)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm font-medium">Pendente</p>
                          <p className="text-2xl font-bold text-yellow-500">
                            {formatCurrency(selectedInstallment.summary.totalPending)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Vencido</p>
                          <p className="text-2xl font-bold text-red-500">
                            {formatCurrency(selectedInstallment.summary.totalOverdue)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Restante</p>
                          <p className="text-2xl font-bold text-blue-500">
                            {formatCurrency(selectedInstallment.summary.remainingAmount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium mb-2 block">Parcelas</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInstallment.transactions.map((transaction, index) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {format(new Date(transaction.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>
                          {transaction.paidDate
                            ? format(new Date(transaction.paidDate), "dd/MM/yyyy", { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstallmentManagement;

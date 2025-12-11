import { useEffect, useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../lib/api';
import * as XLSX from 'xlsx';

export function Reports() {
  const [dateFrom, setDateFrom] = useState('2025-10-01');
  const [dateTo, setDateTo] = useState('2025-11-04');
  const [loansByMonth, setLoansByMonth] = useState<{ month: string; prestamos: number }[]>([]);
  const [loansByCategory, setLoansByCategory] = useState<{ category: string; count: number }[]>([]);
  const [inventory, setInventory] = useState<{ name: string; value: number }[]>([]);
  const [counts, setCounts] = useState({ categories: 0, locations: 0 });
  const [summary, setSummary] = useState({ totalBooks: 0, availableBooks: 0, activeLoans: 0, dueTodayCount: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getInventoryReport()
      .then(res => {
        setInventory(res.byStatus);
        setCounts({ categories: res.categoriesCount, locations: res.locationsCount });
      })
      .catch(() => {
        setInventory([]);
        setCounts({ categories: 0, locations: 0 });
      });
    api.getSummary().then(s => setSummary(s)).catch(() => {});
  }, []);

  const loadLoansReport = () => {
    setLoading(true);
    setError('');
    api.getLoansReport({ from: dateFrom, to: dateTo })
      .then(res => {
        setLoansByMonth(res.loansByMonth);
        setLoansByCategory(res.loansByCategory);
      })
      .catch(() => {
        setLoansByMonth([]);
        setLoansByCategory([]);
        setError('No se pudieron cargar los reportes');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLoansReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    try {
      setLoading(true);
      const summaryData = await api.getSummary();
      const inventoryData = await api.getInventoryReport();
      const loansData = await api.getLoansReport({ from: dateFrom, to: dateTo });

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet([summaryData]);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

      const wsInventory = XLSX.utils.json_to_sheet(inventoryData.byStatus);
      XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventario');

      const wsLoansMonth = XLSX.utils.json_to_sheet(loansData.loansByMonth);
      XLSX.utils.book_append_sheet(wb, wsLoansMonth, 'PrestamosMes');

      const wsLoansCategory = XLSX.utils.json_to_sheet(loansData.loansByCategory);
      XLSX.utils.book_append_sheet(wb, wsLoansCategory, 'PrestamosCategoria');

      XLSX.writeFile(wb, `reportes-${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo exportar';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#22c55e', '#f59e0b'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 dark:text-gray-100 mb-1">Reportes y Estadísticas</h2>
          <p className="text-gray-500 dark:text-gray-400">Datos obtenidos del backend SQLite</p>
        </div>
        <Button onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4 mr-2" />
          Exportar Datos
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Selector de Rango */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rango de Fechas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={loadLoansReport} disabled={loading}>Aplicar Filtro</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="loans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="loans">Préstamos</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préstamos por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loansByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="prestamos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Préstamos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loansByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="category" type="category" stroke="#6b7280" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado del Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={inventory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {inventory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Inventario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-blue-600 dark:text-blue-400 text-xs mb-1">Total de Títulos</p>
                  <p className="text-blue-900 dark:text-blue-100">{summary.totalBooks}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-green-600 dark:text-green-400 text-xs mb-1">Disponibles</p>
                  <p className="text-green-900 dark:text-green-100">
                    {summary.availableBooks}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-purple-600 dark:text-purple-400 text-xs mb-1">Categorías</p>
                  <p className="text-purple-900 dark:text-purple-100">{counts.categories}</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-orange-600 dark:text-orange-400 text-xs mb-1">Ubicaciones</p>
                  <p className="text-orange-900 dark:text-orange-100">{counts.locations}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

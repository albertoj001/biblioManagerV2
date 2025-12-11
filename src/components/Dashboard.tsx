import { useEffect, useState } from 'react';
import { BookOpen, Users, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { api } from '../lib/api';

export function Dashboard() {
  const [summary, setSummary] = useState({
    totalBooks: 0,
    availableBooks: 0,
    activeLoans: 0,
    dueTodayCount: 0,
    overdueCount: 0,
    topBooks: [] as { title: string; loanCount: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSummary()
      .then(setSummary)
      .catch(() => setSummary(prev => prev))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div>
        <h2 className="text-gray-900 dark:text-gray-100 mb-1">Sistema de Inventario</h2>
        <p className="text-gray-500 dark:text-gray-400">Resumen en tiempo real desde el backend (SQLite)</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Títulos</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalBooks}</div>
            <p className="text-xs text-muted-foreground">Disponibles: {summary.availableBooks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeLoans}</div>
            <p className="text-xs text-muted-foreground">Vencen hoy: {summary.dueTodayCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Libros retrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.overdueCount}</div>
            <p className="text-xs text-muted-foreground">Revisar en devoluciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.availableBooks}</div>
            <p className="text-xs text-muted-foreground">Inventario listo para préstamo</p>
          </CardContent>
        </Card>
      </div>

      {/* Top books */}
      <Card>
        <CardHeader>
          <CardTitle>Top libros más prestados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>}
          {!loading && summary.topBooks.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos aún.</p>
          )}
          {!loading && summary.topBooks.map((book, index) => (
            <div key={book.title} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="text-gray-900 dark:text-gray-100">{book.title}</p>
                  <p className="text-xs text-gray-500">Préstamos: {book.loanCount}</p>
                </div>
              </div>
              <Badge variant="outline">#{index + 1}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

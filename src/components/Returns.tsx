import { useEffect, useState } from 'react';
import { Scan, CheckCircle, AlertCircle, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { api, type Loan, type User } from '../lib/api';
import { toast } from 'sonner@2.0.3';

export function Returns() {
  const [bookCode, setBookCode] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [returnInfo, setReturnInfo] = useState<{ daysLate: number; fine: number }>({ daysLate: 0, fine: 0 });
  const [bookTitle, setBookTitle] = useState('');
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const loadActiveLoans = async () => {
    try {
      const res = await api.getLoans({ status: 'activo' });
      setActiveLoans(res.items);
    } catch {
      setActiveLoans([]);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.items);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadActiveLoans();
    loadUsers();
  }, []);

  const handleScanBook = async () => {
    setError('');
    setLoading(true);
    try {
      const resBook = await api.getBooks({ search: bookCode, pageSize: 1 });
      const book = resBook.items[0];
      if (!book) {
        setError('Libro no encontrado. Verifica el código de barras.');
        setSelectedLoan(null);
        return;
      }
      setBookTitle(book.title);
      const loansRes = await api.getLoans({ bookId: String(book.id), status: 'activo' });
      const loan = loansRes.items[0];
      if (!loan) {
        setError('No se encontró un préstamo activo para este libro.');
        setSelectedLoan(null);
        return;
      }
      setSelectedLoan(loan);
    } catch {
      setError('Error al buscar el libro.');
      setSelectedLoan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedLoan) return;
    setLoading(true);
    try {
      const res = await api.returnBook({ bookId: selectedLoan.bookId });
      setReturnInfo({ daysLate: res.daysLate, fine: res.fine });
      setShowReceipt(true);
      toast.success('Devolución registrada');
      loadActiveLoans();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo registrar la devolución';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReturn = () => {
    setBookCode('');
    setSelectedLoan(null);
    setShowReceipt(false);
    setError('');
    setReturnInfo({ daysLate: 0, fine: 0 });
    setBookTitle('');
  };

  const daysLate = returnInfo.daysLate;
  const fine = returnInfo.fine;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-gray-900 dark:text-gray-100 mb-1">Devolución de Libros</h2>
        <p className="text-gray-500 dark:text-gray-400">Escanea el código del libro para procesar la devolución</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!showReceipt ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Escanear Libro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-5 h-5" />
                Escanear Libro a Devolver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="returnCode">Código de Barras del Libro</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="returnCode"
                    placeholder="Ej: LIB001"
                    value={bookCode}
                    onChange={(e) => setBookCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScanBook()}
                    disabled={loading}
                  />
                  <Button onClick={handleScanBook} disabled={loading}>
                    <Scan className="w-4 h-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>

              {!selectedLoan && (
                <div className="p-8 text-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                  <Scan className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Escanea el código del libro que se va a devolver</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Préstamo */}
          {selectedLoan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Información del Préstamo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-500 text-xs">Libro</p>
                    <p className="text-gray-900 dark:text-gray-100">{bookTitle || selectedLoan.bookTitle}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-xs">Usuario</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedLoan.userName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-500 text-xs">Fecha de Préstamo</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(selectedLoan.loanDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Fecha de Vencimiento</p>
                      <p className="text-gray-900 dark:text-gray-100">
                        {new Date(selectedLoan.dueDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs mb-1">Estado</p>
                    <Badge variant={daysLate > 0 ? 'destructive' : 'default'}>
                      {daysLate > 0 ? `Retrasado (${daysLate} días)` : 'A tiempo'}
                    </Badge>
                  </div>

                  {daysLate > 0 && (
                    <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        <p>Mora calculada: ${fine.toFixed(2)}</p>
                        <p className="text-xs mt-1">$0.50 por día de retraso - {daysLate} días</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleConfirmReturn}
                  disabled={loading}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmar Devolución
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Recibo de Devolución
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-gray-900 dark:text-gray-100 mb-2">Devolución Completada</h3>
              <p className="text-gray-500 dark:text-gray-400">El libro ha sido devuelto exitosamente</p>
            </div>

            <div className="border-t border-b border-gray-200 dark:border-gray-800 py-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Número de Recibo</span>
                <span className="text-gray-900 dark:text-gray-100">RET-{Date.now().toString().slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha de Devolución</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date().toLocaleDateString('es-ES')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Libro</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedLoan?.bookTitle || bookTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Usuario</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedLoan?.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Días de Préstamo</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {selectedLoan ? Math.ceil((new Date().getTime() - new Date(selectedLoan.loanDate).getTime()) / (1000 * 60 * 60 * 24)) : 0} días
                </span>
              </div>
              {daysLate > 0 && (
                <>
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Días de Retraso</span>
                    <span>{daysLate} días</span>
                  </div>
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Mora a Pagar</span>
                    <span>${fine.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {daysLate === 0 && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  ¡Excelente! El libro fue devuelto a tiempo. No hay mora que pagar.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                Imprimir Recibo
              </Button>
              <Button className="flex-1" onClick={handleNewReturn}>
                Nueva Devolución
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Préstamos activos */}
      <Card>
        <CardHeader>
          <CardTitle>Préstamos activos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeLoans.length === 0 ? (
            <p className="text-sm text-gray-500">No hay préstamos activos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Libro</th>
                    <th className="py-2">Usuario</th>
                    <th className="py-2">Vence</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => (
                    <tr key={loan.id} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="py-2 text-gray-900 dark:text-gray-100">{loan.bookTitle}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{loan.userName}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">
                        {new Date(loan.dueDate).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-2">
                        <Badge variant="default">Activo</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">No hay usuarios</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2">Nombre</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Tipo</th>
                    <th className="py-2">Estado</th>
                    <th className="py-2">Préstamos Activos</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-gray-200 dark:border-gray-800">
                      <td className="py-2 text-gray-900 dark:text-gray-100">{user.name}</td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{user.email}</td>
                      <td className="py-2">
                        <Badge variant={user.type === 'staff' ? 'default' : 'secondary'}>
                          {user.type === 'staff' ? 'Staff' : 'Estudiante'}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge variant={user.status === 'activo' ? 'default' : 'destructive'}>
                          {user.status === 'activo' ? 'Activo' : 'Sancionado'}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-300">{user.activeLoans}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

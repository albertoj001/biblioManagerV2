import { useEffect, useState } from 'react';
import { User, BookOpen, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { api, type Book, type User as UserType, type Loan } from '../lib/api';
import { toast } from 'sonner@2.0.3';

export function Loans() {
  const [bookCode, setBookCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);

  const loadActiveLoans = async () => {
    try {
      const res = await api.getLoans({ status: 'activo' });
      setActiveLoans(res.items);
    } catch {
      setActiveLoans([]);
    }
  };

  useEffect(() => {
    loadActiveLoans();
  }, []);

  const handleSearchBook = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.getBooks({ search: bookCode, status: 'disponible', pageSize: 1 });
      const book = res.items[0];
      if (!book) {
        setError('Libro no encontrado o no disponible.');
        setSelectedBook(null);
      } else {
        setSelectedBook(book);
      }
    } catch {
      setError('Error al buscar libro');
      setSelectedBook(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUser = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.getUsers({ search: userCode });
      const user = res.items[0];
      if (!user) {
        setError('Usuario no encontrado.');
        setSelectedUser(null);
      } else if (user.status !== 'activo') {
        setError('Este usuario está sancionado y no puede realizar préstamos.');
        setSelectedUser(null);
      } else {
        setSelectedUser(user);
      }
    } catch {
      setError('Error al buscar usuario');
      setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBook || !selectedUser || !dueDate) return;
    setLoading(true);
    try {
      await api.createLoan({ bookId: selectedBook.id, userId: selectedUser.id, dueDate });
      setShowConfirmation(true);
      toast.success('Préstamo registrado');
      loadActiveLoans();
      setTimeout(() => {
        setShowConfirmation(false);
        setBookCode('');
        setUserCode('');
        setSelectedBook(null);
        setSelectedUser(null);
        setDueDate('');
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo registrar el préstamo';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDefaultDueDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 15);
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-gray-900 dark:text-gray-100 mb-1">Nuevo Préstamo</h2>
        <p className="text-gray-500 dark:text-gray-400">Ingresa los datos para registrar un préstamo</p>
      </div>

      {showConfirmation && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Préstamo registrado exitosamente. Devuelve antes del {new Date(dueDate).toLocaleDateString('es-ES')}.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buscar Libro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              1. Seleccionar Libro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bookCode">Código o Título del Libro</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="bookCode"
                  placeholder="Ej: LIB001 o Cien años de soledad"
                  value={bookCode}
                  onChange={(e) => setBookCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchBook()}
                  disabled={loading}
                />
                <Button onClick={handleSearchBook} disabled={loading}>
                  Buscar
                </Button>
              </div>
            </div>

            {selectedBook && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100">{selectedBook.title}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{selectedBook.author}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{selectedBook.category}</Badge>
                      <Badge variant="default">Disponible</Badge>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">Ubicación: {selectedBook.location}</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedBook && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Busca el libro por código o título</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buscar Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              2. Identificar Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userCode">ID, Email o Nombre del Usuario</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="userCode"
                  placeholder="Ej: 1, email@example.com o Ana Garcia"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                  disabled={loading}
                />
                <Button onClick={handleSearchUser} disabled={loading}>
                  Buscar
                </Button>
              </div>
            </div>

            {selectedUser && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100">{selectedUser.name}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={selectedUser.type === 'staff' ? 'default' : 'secondary'}>
                        {selectedUser.type === 'staff' ? 'Staff' : 'Estudiante'}
                      </Badge>
                      <Badge variant="outline">Activo</Badge>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">Préstamos activos: {selectedUser.activeLoans}</p>
                  </div>
                </div>
              </div>
            )}

            {!selectedUser && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Busca el usuario por ID, email o nombre</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            3. Fecha de Devolución
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loanDate">Fecha de Préstamo</Label>
              <Input
                id="loanDate"
                type="date"
                value={getTodayDate()}
                disabled
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Fecha de Devolución</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={getTodayDate()}
                placeholder={getDefaultDueDate()}
                className="mt-2"
                disabled={loading}
              />
            </div>
          </div>

          {selectedBook && selectedUser && dueDate && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-900 dark:text-blue-100 mb-2">Resumen del Préstamo</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="text-blue-700 dark:text-blue-300">Libro:</p>
                <p className="text-blue-900 dark:text-blue-100">{selectedBook.title}</p>
                <p className="text-blue-700 dark:text-blue-300">Usuario:</p>
                <p className="text-blue-900 dark:text-blue-100">{selectedUser.name}</p>
                <p className="text-blue-700 dark:text-blue-300">Fecha límite:</p>
                <p className="text-blue-900 dark:text-blue-100">{new Date(dueDate).toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={!selectedBook || !selectedUser || !dueDate || loading}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Confirmar Préstamo
          </Button>
        </CardContent>
      </Card>

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
    </div>
  );
}

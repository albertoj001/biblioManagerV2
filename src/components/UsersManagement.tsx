import { useEffect, useState } from 'react';
import { Plus, Edit, Eye, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { api, type User, type Loan } from '../lib/api';
import { toast } from 'sonner@2.0.3';

export function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'new'>('view');
  const [formData, setFormData] = useState<Partial<User>>({});
  const [userLoans, setUserLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers({ search: searchTerm });
      setUsers(res.items);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm]);

  const handleViewUser = async (user: User) => {
    setSelectedUser(user);
    setDialogMode('view');
    setShowDialog(true);
    try {
      const res = await api.getLoans({ userId: String(user.id) });
      setUserLoans(res.items);
    } catch {
      setUserLoans([]);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData(user);
    setDialogMode('edit');
    setShowDialog(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      type: 'estudiante',
      phone: '',
      status: 'activo',
      sanctions: 0,
      activeLoans: 0,
    });
    setDialogMode('new');
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Nombre y email son obligatorios');
      return;
    }
    try {
      if (dialogMode === 'new') {
        await api.createUser({
          name: formData.name,
          email: formData.email,
          type: formData.type || 'estudiante',
          phone: formData.phone || '',
          status: formData.status || 'activo',
          sanctions: formData.sanctions || 0,
          activeLoans: formData.activeLoans || 0,
        });
        toast.success('Usuario creado');
      } else if (dialogMode === 'edit' && selectedUser) {
        await api.updateUser(selectedUser.id, {
          name: formData.name,
          email: formData.email,
          type: formData.type,
          phone: formData.phone,
          status: formData.status,
          sanctions: formData.sanctions,
          activeLoans: formData.activeLoans,
        });
        toast.success('Usuario actualizado');
      }
      setShowDialog(false);
      loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar usuario';
      toast.error(message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 dark:text-gray-100 mb-1">Gestión de Usuarios</h2>
          <p className="text-gray-500 dark:text-gray-400">Administra estudiantes y personal de la biblioteca</p>
        </div>
        <Button onClick={handleNewUser}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Préstamos Activos</TableHead>
              <TableHead>Sanciones</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">Cargando...</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-gray-900 dark:text-gray-100">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.type === 'staff' ? 'default' : 'secondary'}>
                      {user.type === 'staff' ? 'Staff' : 'Estudiante'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{user.phone}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'activo' ? 'default' : 'destructive'}>
                      {user.status === 'activo' ? 'Activo' : 'Sancionado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{user.activeLoans}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{user.sanctions}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'new' ? 'Nuevo Usuario' : dialogMode === 'edit' ? 'Editar Usuario' : 'Detalle del Usuario'}
            </DialogTitle>
          </DialogHeader>

          {dialogMode === 'view' && selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-gray-100 mb-1">{selectedUser.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={selectedUser.type === 'staff' ? 'default' : 'secondary'}>
                      {selectedUser.type === 'staff' ? 'Staff' : 'Estudiante'}
                    </Badge>
                    <Badge variant={selectedUser.status === 'activo' ? 'default' : 'destructive'}>
                      {selectedUser.status === 'activo' ? 'Activo' : 'Sancionado'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Teléfono</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedUser.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Préstamos Activos</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedUser.activeLoans}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Sanciones</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedUser.sanctions}</p>
                </div>
              </div>

              <div>
                <h4 className="text-gray-900 dark:text-gray-100 mb-3">Historial de Préstamos</h4>
                <div className="space-y-2">
                  {userLoans.map((loan) => (
                    <div key={loan.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-gray-900 dark:text-gray-100">{loan.bookTitle}</p>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(loan.loanDate).toLocaleDateString('es-ES')} - {new Date(loan.dueDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <Badge variant={loan.status === 'retrasado' ? 'destructive' : loan.status === 'devuelto' ? 'secondary' : 'default'}>
                          {loan.status === 'retrasado' ? 'Retrasado' : loan.status === 'devuelto' ? 'Devuelto' : 'Activo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {userLoans.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No hay préstamos registrados</p>
                  )}
                </div>
              </div>

              {selectedUser.status === 'sancionado' && (
                <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <CardContent className="p-4">
                    <h4 className="text-red-900 dark:text-red-100 mb-2">Sanciones Activas</h4>
                    <p className="text-red-700 dark:text-red-300 text-xs">
                      Este usuario tiene {selectedUser.sanctions} sanción(es) por devoluciones tardías.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {(dialogMode === 'edit' || dialogMode === 'new') && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Usuario</Label>
                  <Select value={formData.type} onValueChange={(value: 'estudiante' | 'staff') => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estudiante">Estudiante</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value: 'activo' | 'sancionado') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="sancionado">Sancionado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {dialogMode === 'new' ? 'Crear Usuario' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

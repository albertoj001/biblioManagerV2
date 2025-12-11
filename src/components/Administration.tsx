import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Tag, Users as UsersIcon, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { api } from '../lib/api';
import { toast } from 'sonner@2.0.3';

export function Administration() {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'category' | 'author' | 'location'>('category');
  const [itemName, setItemName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [localCategories, setLocalCategories] = useState<string[]>([]);
  const [localAuthors, setLocalAuthors] = useState<string[]>([]);
  const [localLocations, setLocalLocations] = useState<string[]>([]);

  useEffect(() => {
    api.getCategories().then(setLocalCategories).catch(() => setLocalCategories([]));
    api.getAuthors().then(setLocalAuthors).catch(() => setLocalAuthors([]));
    api.getLocations().then(setLocalLocations).catch(() => setLocalLocations([]));
  }, []);

  const handleAdd = (type: 'category' | 'author' | 'location') => {
    setDialogType(type);
    setItemName('');
    setEditingIndex(null);
    setShowDialog(true);
  };

  const handleEdit = (type: 'category' | 'author' | 'location', index: number, name: string) => {
    setDialogType(type);
    setItemName(name);
    setEditingIndex(index);
    setShowDialog(true);
  };

  const handleDelete = (type: 'category' | 'author' | 'location', index: number) => {
    if (type === 'category') {
      setLocalCategories(localCategories.filter((_, i) => i !== index));
    } else if (type === 'author') {
      setLocalAuthors(localAuthors.filter((_, i) => i !== index));
    } else {
      setLocalLocations(localLocations.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!itemName.trim()) return;
    try {
      if (dialogType === 'category') {
        if (editingIndex !== null) {
          const newCategories = [...localCategories];
          newCategories[editingIndex] = itemName;
          setLocalCategories(newCategories);
        } else {
          await api.createCategory(itemName);
          setLocalCategories([...localCategories, itemName]);
        }
      } else if (dialogType === 'author') {
        if (editingIndex !== null) {
          const newAuthors = [...localAuthors];
          newAuthors[editingIndex] = itemName;
          setLocalAuthors(newAuthors);
        } else {
          await api.createAuthor(itemName);
          setLocalAuthors([...localAuthors, itemName]);
        }
      } else {
        if (editingIndex !== null) {
          const newLocations = [...localLocations];
          newLocations[editingIndex] = itemName;
          setLocalLocations(newLocations);
        } else {
          await api.createLocation(itemName);
          setLocalLocations([...localLocations, itemName]);
        }
      }
      toast.success('Guardado');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(message);
    } finally {
      setShowDialog(false);
      setItemName('');
      setEditingIndex(null);
    }
  };

  const getDialogTitle = () => {
    const typeLabel = dialogType === 'category' ? 'Categoría' : dialogType === 'author' ? 'Autor' : 'Ubicación';
    return editingIndex !== null ? `Editar ${typeLabel}` : `Nueva ${typeLabel}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-gray-900 dark:text-gray-100 mb-1">Administración</h2>
        <p className="text-gray-500 dark:text-gray-400">Gestiona las categorías, autores y ubicaciones del sistema</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="authors">Autores</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
        </TabsList>

        {/* Categorías */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Categorías de Libros
              </CardTitle>
              <Button onClick={() => handleAdd('category')}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localCategories.map((category, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between group hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-gray-900 dark:text-gray-100">{category}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit('category', index, category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete('category', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Total de categorías: <span className="text-gray-900 dark:text-gray-100">{localCategories.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Autores */}
        <TabsContent value="authors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                Autores Registrados
              </CardTitle>
              <Button onClick={() => handleAdd('author')}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Autor
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {localAuthors.map((author, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between group hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white">
                        {author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-gray-900 dark:text-gray-100">{author}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit('author', index, author)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete('author', index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Total de autores: <span className="text-gray-900 dark:text-gray-100">{localAuthors.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ubicaciones */}
        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicaciones y Estanterías
              </CardTitle>
              <Button onClick={() => handleAdd('location')}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Ubicación
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {localLocations.map((location, index) => (
                  <div key={index} className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg group hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit('location', index, location)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('location', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100">{location}</p>
                    <Badge variant="outline" className="mt-2">
                      {/* Placeholder count; full sync would require endpoint with counts */}
                      {Math.floor(Math.random() * 50)} libros
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Total de ubicaciones: <span className="text-gray-900 dark:text-gray-100">{localLocations.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="itemName">
                {dialogType === 'category' ? 'Nombre de la Categoría' : 
                 dialogType === 'author' ? 'Nombre del Autor' : 
                 'Nombre de la Ubicación'}
              </Label>
              <Input
                id="itemName"
                placeholder={
                  dialogType === 'category' ? 'Ej: Romance' :
                  dialogType === 'author' ? 'Ej: Isabel Allende' :
                  'Ej: Estante G-1'
                }
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingIndex !== null ? 'Guardar Cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

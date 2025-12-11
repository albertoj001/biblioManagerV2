import { useEffect, useState } from 'react';
import { Search, Filter, Eye, BookOpen, Plus, Upload } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { api, type Book } from '../lib/api';
import { toast } from 'sonner@2.0.3';

export function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    author: '',
    category: '',
    status: 'disponible',
    location: '',
    synopsis: '',
    coverUrl: '',
  });
  const [coverUploading, setCoverUploading] = useState(false);

  const loadCategories = () => {
    api.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadBooks = () => {
    setLoading(true);
    setError('');
    api.getBooks({
      search: searchTerm,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: currentPage,
      pageSize: itemsPerPage,
    })
      .then(res => {
        setBooks(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        setError('No se pudieron cargar los libros');
        setBooks([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooks();
  }, [searchTerm, categoryFilter, statusFilter, currentPage]);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  const handleAddBook = async () => {
    if (!addForm.title || !addForm.author) {
      toast.error('Completa título y autor');
      return;
    }
    try {
      await api.createBook({
        title: addForm.title,
        author: addForm.author,
        category: addForm.category || 'General',
        status: addForm.status as 'disponible' | 'prestado',
        location: addForm.location || 'Sin ubicar',
        synopsis: addForm.synopsis,
        coverUrl: addForm.coverUrl || null,
      });
      toast.success('Libro creado');
      setShowAddDialog(false);
      setAddForm({
        title: '',
        author: '',
        category: '',
        status: 'disponible',
        location: '',
        synopsis: '',
        coverUrl: '',
      });
      setCurrentPage(1);
      loadBooks();
      loadCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el libro';
      toast.error(message);
    }
  };

  const handleCoverUpload = (file: File, bookId?: string | number) => {
    const reader = new FileReader();
    setCoverUploading(true);
    reader.onload = async () => {
      const base64 = reader.result as string;
      if (bookId) {
        try {
          const updated = await api.updateBook(bookId, { coverUrl: base64 });
          setSelectedBook(updated);
          loadBooks();
          toast.success('Portada actualizada');
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'No se pudo actualizar la portada';
          toast.error(message);
        } finally {
          setCoverUploading(false);
        }
      } else {
        setAddForm(prev => ({ ...prev, coverUrl: base64 }));
        setCoverUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error('No se pudo leer el archivo');
      setCoverUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900 dark:text-gray-100 mb-1">Catálogo de Libros</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar libro
          </Button>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400">Busca y gestiona el inventario de libros</p>

      {/* Búsqueda y Filtros */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por título, autor, ISBN, código..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setCurrentPage(1); setSearchTerm(e.target.value); }}
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={(value) => { setCurrentPage(1); setCategoryFilter(value); }}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => { setCurrentPage(1); setStatusFilter(value); }}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="prestado">Prestado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de Libros */}
      <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
                </TableCell>
              </TableRow>
            ) : books.length > 0 ? (
              books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>
                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                      {book.barcode}
                    </code>
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">{book.title}</TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{book.author}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{book.category}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 dark:text-gray-400">{book.location}</TableCell>
                  <TableCell>
                    <Badge variant={book.status === 'disponible' ? 'default' : 'secondary'}>
                      {book.status === 'disponible' ? 'Disponible' : 'Prestado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBook(book)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                    <p className="text-gray-500 dark:text-gray-400">{error || 'No se encontraron libros'}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">
                      Intenta ajustar los filtros de búsqueda
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        {total > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Página {currentPage} de {totalPages} ({total} resultados)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detalle del Libro */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Agregar nuevo libro</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label> Título </Label>
              <Input value={addForm.title} onChange={(e) => setAddForm(prev => ({ ...prev, title: e.target.value }))} />
              <Label> Autor </Label>
              <Input value={addForm.author} onChange={(e) => setAddForm(prev => ({ ...prev, author: e.target.value }))} />
            </div>
            <div className="space-y-3">
              <Label> Categoría </Label>
              <Select value={addForm.category} onValueChange={(value) => setAddForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label> Ubicación </Label>
              <Input value={addForm.location} onChange={(e) => setAddForm(prev => ({ ...prev, location: e.target.value }))} />
              <Label> Estado </Label>
              <Select value={addForm.status} onValueChange={(value) => setAddForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="prestado">Prestado</SelectItem>
                </SelectContent>
              </Select>
              <Label> Sinopsis </Label>
              <Input value={addForm.synopsis} onChange={(e) => setAddForm(prev => ({ ...prev, synopsis: e.target.value }))} />
              <Label> Portada (imagen)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddBook}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Libro</DialogTitle>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  {selectedBook.coverUrl ? (
                    <img
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      className="aspect-[3/4] w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                      <BookOpen className="w-16 h-16 opacity-50" />
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="text-xs text-gray-500">Actualizar portada</label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverUpload(file, selectedBook.id);
                        }}
                      />
                      <Button variant="outline" size="sm" disabled={coverUploading}>
                        <Upload className="w-4 h-4 mr-1" />
                        {coverUploading ? 'Subiendo...' : 'Subir'}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-gray-900 dark:text-gray-100 mb-1">{selectedBook.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedBook.author}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Código de Barras</p>
                      <code className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {selectedBook.barcode}
                      </code>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Categoría</p>
                      <Badge variant="outline">{selectedBook.category}</Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Estado</p>
                      <Badge variant={selectedBook.status === 'disponible' ? 'default' : 'secondary'}>
                        {selectedBook.status === 'disponible' ? 'Disponible' : 'Prestado'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Ubicación</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedBook.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Veces Prestado</p>
                      <p className="text-gray-900 dark:text-gray-100">{selectedBook.loanCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-2">Sinopsis</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedBook.synopsis}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-2">Historial de Préstamos</p>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 dark:text-gray-100">No implementado en detalle</span>
                      <span className="text-gray-500 text-xs">Consulta reportes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

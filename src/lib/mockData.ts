export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: 'disponible' | 'prestado';
  location: string;
  barcode: string;
  synopsis: string;
  coverUrl?: string;
  loanCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  type: 'estudiante' | 'staff';
  phone: string;
  status: 'activo' | 'sancionado';
  sanctions: number;
  activeLoans: number;
}

export interface Loan {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'activo' | 'retrasado' | 'devuelto';
}

export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    isbn: '978-0307474728',
    category: 'Literatura',
    status: 'disponible',
    location: 'Estante A-1',
    barcode: 'LIB001',
    synopsis: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.',
    loanCount: 45,
  },
  {
    id: '2',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    isbn: '978-8491050391',
    category: 'Clásicos',
    status: 'prestado',
    location: 'Estante A-2',
    barcode: 'LIB002',
    synopsis: 'Las aventuras de un hidalgo que pierde la razón y se cree caballero andante.',
    loanCount: 38,
  },
  {
    id: '3',
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    category: 'Ciencia Ficción',
    status: 'disponible',
    location: 'Estante B-1',
    barcode: 'LIB003',
    synopsis: 'Una distopía sobre un régimen totalitario que controla todos los aspectos de la vida.',
    loanCount: 52,
  },
  {
    id: '4',
    title: 'El principito',
    author: 'Antoine de Saint-Exupéry',
    isbn: '978-0156012195',
    category: 'Infantil',
    status: 'disponible',
    location: 'Estante C-1',
    barcode: 'LIB004',
    synopsis: 'Un pequeño príncipe viaja por el universo aprendiendo sobre la vida y el amor.',
    loanCount: 67,
  },
  {
    id: '5',
    title: 'Sapiens: De animales a dioses',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    category: 'Historia',
    status: 'prestado',
    location: 'Estante D-1',
    barcode: 'LIB005',
    synopsis: 'Una breve historia de la humanidad desde la Edad de Piedra hasta la actualidad.',
    loanCount: 41,
  },
  {
    id: '6',
    title: 'El código Da Vinci',
    author: 'Dan Brown',
    isbn: '978-0307474278',
    category: 'Thriller',
    status: 'disponible',
    location: 'Estante E-1',
    barcode: 'LIB006',
    synopsis: 'Un simbologista descubre un misterio que podría cambiar la historia.',
    loanCount: 33,
  },
  {
    id: '7',
    title: 'Harry Potter y la piedra filosofal',
    author: 'J.K. Rowling',
    isbn: '978-0439708180',
    category: 'Fantasía',
    status: 'disponible',
    location: 'Estante F-1',
    barcode: 'LIB007',
    synopsis: 'Un niño descubre que es un mago y comienza sus estudios en Hogwarts.',
    loanCount: 89,
  },
  {
    id: '8',
    title: 'Crónica de una muerte anunciada',
    author: 'Gabriel García Márquez',
    isbn: '978-0307387981',
    category: 'Literatura',
    status: 'prestado',
    location: 'Estante A-3',
    barcode: 'LIB008',
    synopsis: 'La reconstrucción de un asesinato anunciado públicamente pero no evitado.',
    loanCount: 28,
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ana García',
    email: 'ana.garcia@example.com',
    type: 'estudiante',
    phone: '+34 600 123 456',
    status: 'activo',
    sanctions: 0,
    activeLoans: 2,
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    type: 'estudiante',
    phone: '+34 600 234 567',
    status: 'activo',
    sanctions: 0,
    activeLoans: 1,
  },
  {
    id: '3',
    name: 'María López',
    email: 'maria.lopez@example.com',
    type: 'staff',
    phone: '+34 600 345 678',
    status: 'activo',
    sanctions: 0,
    activeLoans: 0,
  },
  {
    id: '4',
    name: 'Juan Martínez',
    email: 'juan.martinez@example.com',
    type: 'estudiante',
    phone: '+34 600 456 789',
    status: 'sancionado',
    sanctions: 1,
    activeLoans: 0,
  },
];

export const mockLoans: Loan[] = [
  {
    id: '1',
    bookId: '2',
    bookTitle: 'Don Quijote de la Mancha',
    userId: '1',
    userName: 'Ana García',
    loanDate: '2025-10-20',
    dueDate: '2025-11-04',
    status: 'activo',
  },
  {
    id: '2',
    bookId: '5',
    bookTitle: 'Sapiens: De animales a dioses',
    userId: '2',
    userName: 'Carlos Rodríguez',
    loanDate: '2025-10-15',
    dueDate: '2025-10-30',
    status: 'retrasado',
  },
  {
    id: '3',
    bookId: '8',
    bookTitle: 'Crónica de una muerte anunciada',
    userId: '1',
    userName: 'Ana García',
    loanDate: '2025-10-25',
    dueDate: '2025-11-09',
    status: 'activo',
  },
];

export const categories = [
  'Literatura',
  'Clásicos',
  'Ciencia Ficción',
  'Infantil',
  'Historia',
  'Thriller',
  'Fantasía',
  'Biografía',
  'Ciencia',
  'Arte',
];

export const locations = [
  'Estante A-1',
  'Estante A-2',
  'Estante A-3',
  'Estante B-1',
  'Estante B-2',
  'Estante C-1',
  'Estante C-2',
  'Estante D-1',
  'Estante E-1',
  'Estante F-1',
];

export const authors = [
  'Gabriel García Márquez',
  'Miguel de Cervantes',
  'George Orwell',
  'Antoine de Saint-Exupéry',
  'Yuval Noah Harari',
  'Dan Brown',
  'J.K. Rowling',
  'Isabel Allende',
  'Mario Vargas Llosa',
  'Julio Cortázar',
];

export interface AuthUser {
  email: string;
  password: string;
  name: string;
  role: string;
}

export const authUsers: AuthUser[] = [
  {
    email: 'admin@biblioteca.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'Bibliotecario',
  },
  {
    email: 'bibliotecario@biblioteca.com',
    password: 'biblio123',
    name: 'Juan Pérez',
    role: 'Bibliotecario',
  },
];

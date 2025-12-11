const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
  coverUrl?: string | null;
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

export interface LoginResult {
  token: string;
  user: { name: string; role: string; email: string };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login(body: { email: string; password: string }) {
    return request<LoginResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getBooks(params: Record<string, string | number | undefined> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<{ items: Book[]; total: number; page: number; pageSize: number }>(
      `/books?${qs.toString()}`
    );
  },
  createBook(body: Omit<Book, 'id' | 'loanCount'>) {
    return request<Book>('/books', { method: 'POST', body: JSON.stringify(body) });
  },
  updateBook(id: string | number, body: Partial<Omit<Book, 'id'>>) {
    return request<Book>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  getBookById(id: string) {
    return request<Book>(`/books/${id}`);
  },
  createLoan(body: { bookId: string; userId: string; dueDate: string }) {
    return request<Loan>('/loans', { method: 'POST', body: JSON.stringify(body) });
  },
  getLoans(params: Record<string, string> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
    return request<{ items: Loan[]; total: number }>(`/loans?${qs.toString()}`);
  },
  returnBook(body: { bookId: string }) {
    return request<{ loan: Loan; daysLate: number; fine: number }>('/returns', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getUsers(params: Record<string, string> = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
    return request<{ items: User[]; total: number }>(`/users?${qs.toString()}`);
  },
  createUser(body: Omit<User, 'id'>) {
    return request<User>('/users', { method: 'POST', body: JSON.stringify(body) });
  },
  updateUser(id: string | number, body: Partial<Omit<User, 'id'>>) {
    return request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) });
  },
  getCategories() {
    return request<string[]>('/catalogs/categories');
  },
  createCategory(name: string) {
    return request<{ id: string; name: string }>('/catalogs/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  getAuthors() {
    return request<string[]>('/catalogs/authors');
  },
  createAuthor(name: string) {
    return request<{ id: string; name: string }>('/catalogs/authors', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  getLocations() {
    return request<string[]>('/catalogs/locations');
  },
  createLocation(name: string) {
    return request<{ id: string; name: string }>('/catalogs/locations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  getSummary() {
    return request<{
      totalBooks: number;
      availableBooks: number;
      activeLoans: number;
      dueTodayCount: number;
      overdueCount: number;
      topBooks: { title: string; loanCount: number }[];
    }>('/reports/summary');
  },
  getInventoryReport() {
    return request<{ byStatus: { name: string; value: number }[]; categoriesCount: number; locationsCount: number }>(
      '/reports/inventory'
    );
  },
  getLoansReport(params: { from?: string; to?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    return request<{ loansByMonth: { month: string; prestamos: number }[]; loansByCategory: { category: string; count: number }[]; totals: { count: number; returnRate: number } }>(
      `/reports/loans?${qs.toString()}`
    );
  },
};

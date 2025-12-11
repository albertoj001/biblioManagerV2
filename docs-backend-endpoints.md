# API Backend - Responsive Library Inventory App

## Autenticación
### POST /auth/login
Request:
{
  "email": "admin@biblioteca.com",
  "password": "admin123"
}
Response 200:
{
  "token": "jwt-token",
  "user": {
    "name": "Administrador",
    "role": "Bibliotecario",
    "email": "admin@biblioteca.com"
  }
}

## Libros
### GET /books
Query params: search, category, status, page, pageSize
Response 200:
{
  "items": [
    {
      "id": "1",
      "title": "Cien anos de soledad",
      "author": "Gabriel Garcia Marquez",
      "isbn": "978-0307474728",
      "category": "Literatura",
      "status": "disponible",
      "location": "Estante A-1",
      "barcode": "LIB001",
      "synopsis": "...",
      "coverUrl": "https://...",
      "loanCount": 45
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}

### GET /books/:id
Response 200: Book

### POST /books
Body example:
{
  "title": "Nuevo libro",
  "author": "Autor",
  "isbn": "111-222",
  "category": "Historia",
  "status": "disponible",
  "location": "Estante B-1",
  "barcode": "LIB010",
  "synopsis": "...",
  "coverUrl": null
}
Response 201: Book (with id, loanCount inicial 0)

### PUT /books/:id
Body: mismos campos; Response 200: Book actualizado

### DELETE /books/:id
Response 204

## Usuarios
### GET /users
Query: search
Response 200:
{
  "items": [
    {
      "id": "1",
      "name": "Ana Garcia",
      "email": "ana@example.com",
      "type": "estudiante",
      "phone": "+34 600 123 456",
      "status": "activo",
      "sanctions": 0,
      "activeLoans": 2
    }
  ],
  "total": 1
}

### POST /users
Body example:
{
  "name": "Nuevo Usuario",
  "email": "user@example.com",
  "type": "staff",
  "phone": "+34 600 000 000",
  "status": "activo",
  "sanctions": 0,
  "activeLoans": 0
}
Response 201: User (con id)

### PUT /users/:id
Body: mismos campos; Response 200: User

### DELETE /users/:id
Response 204

## Prestamos
### POST /loans
Body ejemplo:
{
  "bookId": "2",
  "userId": "1",
  "dueDate": "2025-11-20"
}
Validaciones: libro disponible y usuario activo.
Response 201:
{
  "id": "10",
  "bookId": "2",
  "bookTitle": "Sapiens",
  "userId": "1",
  "userName": "Ana Garcia",
  "loanDate": "2025-11-05",
  "dueDate": "2025-11-20",
  "status": "activo"
}

### GET /loans
Query: userId, bookId, status
Response 200: { "items": [Loan], "total": 12 }

## Devoluciones
### POST /returns
Body ejemplo:
{
  "bookId": "2"
}
Acciones: cierra prestamo activo (status=devuelto, returnDate=today), actualiza libro a disponible, decrementa activeLoans. Calcula mora.
Response 200:
{
  "loan": {
    "id": "10",
    "bookId": "2",
    "bookTitle": "Sapiens",
    "userId": "1",
    "userName": "Ana Garcia",
    "loanDate": "2025-11-05",
    "dueDate": "2025-11-20",
    "returnDate": "2025-11-18",
    "status": "devuelto"
  },
  "daysLate": 0,
  "fine": 0
}

## Catalogos (Administracion)
### GET /catalogs/categories | POST /catalogs/categories
POST body: { "name": "Historia" }
Response 201: { "name": "Historia", "id": "cat-1" }

### GET /catalogs/authors | POST /catalogs/authors
POST body: { "name": "Isabel Allende" }
Response 201: { "name": "Isabel Allende", "id": "auth-1" }

### GET /catalogs/locations | POST /catalogs/locations
POST body: { "name": "Estante G-1" }
Response 201: { "name": "Estante G-1", "id": "loc-1" }

## Reportes
### GET /reports/summary
Response 200:
{
  "totalBooks": 345,
  "availableBooks": 210,
  "activeLoans": 26,
  "dueTodayCount": 3,
  "overdueCount": 12,
  "topBooks": [
    { "title": "Libro 1", "loanCount": 67 },
    { "title": "Libro 2", "loanCount": 52 }
  ]
}

### GET /reports/inventory
Response 200:
{
  "byStatus": [
    { "name": "Disponible", "value": 210 },
    { "name": "Prestado", "value": 135 }
  ],
  "categoriesCount": 7,
  "locationsCount": 10
}

### GET /reports/loans?from=2025-10-01&to=2025-11-04
Response 200:
{
  "loansByMonth": [ { "month": "Oct", "prestamos": 61 } ],
  "loansByCategory": [ { "category": "Literatura", "count": 45 } ],
  "totals": { "count": 244, "returnRate": 0.94 }
}

## Reglas y validaciones clave
- ISBN y barcode deben ser unicos.
- No crear prestamo si el libro no esta disponible o el usuario esta sancionado.
- En devoluciones, calcular mora (ej. 0.5 por dia de retraso) y opcionalmente incrementar sanctions.
- Actualizar counters en transaccion: loanCount y activeLoans.

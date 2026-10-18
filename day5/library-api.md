# Library REST API Design

## Endpoints

### 1. List All Books
- **Method:** `GET`
- **Path:** `/api/books`
- **Description:** Retrieves a complete list of all books in the library catalog.
- **Success Status Code:** `200 OK`

---

### 2. Get Single Book
- **Method:** `GET`
- **Path:** `/api/books/:id`
- **Description:** Retrieves detailed information for a single book by its unique ID.
- **Success Status Code:** `200 OK`

---

### 3. Create a New Book
- **Method:** `POST`
- **Path:** `/api/books`
- **Description:** Adds a new book entry to the library database.
- **Example Request Body:**
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "isbn": "978-0132350884",
  "publishedYear": 2008,
  "copiesAvailable": 3
}
# TicketHub System Architecture & Design Document

## 1. Requirements

### Functional Requirements
- Users can browse available concerts, tours, and live events.
- Users can view real-time seat availability maps with clear visual status indicators (available, held, booked).
- Users can temporarily hold specific seats during the checkout process.
- Users can securely process payments and finalize ticket purchases.
- Users can view their purchased ticket history, confirmation numbers, and digital passes.

### Non-Functional Requirements
- **Correctness & Fairness:** Absolute prevention of double-booking seats. High-demand flash sales must operate on a fair first-come, first-served basis backed by a virtual waiting room queue.
- **Speed & Latency:** Event catalog browsing and seat map rendering must load in under 200 ms.
- **High Availability & Scalability:** The system must survive massive traffic surges during high-profile ticket drops without failing or dropping transactions.

---

## 2. Traffic Estimates

### A. Normal Daily Traffic
- **Registered Users:** 2,000,000
- **Daily Active Visitors (DAV):** 50,000 visitors/day
- **Page Views:** 50,000 visitors × 10 pages = 500,000 page views/day
  $$\frac{500,000 \text{ views}}{86,400 \text{ seconds}} \approx \mathbf{5.78 \text{ page views/sec}}$$
- **Ticket Sales:** 5,000 tickets sold/day
  $$\frac{5,000 \text{ sales}}{86,400 \text{ seconds}} \approx \mathbf{0.06 \text{ sales/sec}}$$

### B. "Big Sale" Flash Crowd Peak Traffic
- **Scenario:** 200,000 users attempt to buy 20,000 seats within the first 10 minutes (600 seconds).
- **Average Flash Sale Request Rate:**
  $$\frac{200,000 \text{ users}}{600 \text{ seconds}} \approx \mathbf{333.3 \text{ requests/sec}}$$
- **Peak Spike Multiplier (Stampede Moment at Sale Drop):** Factoring in connection retries and simultaneous clicks when the countdown hits zero, peak traffic surges up to **1,500 to 2,000 requests/sec**.

---

## 3. REST API Specification

| Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events` | Browse and filter upcoming concerts and events | `200 OK` |
| `GET` | `/api/v1/events/:id/seats` | Get real-time seat map and availability status | `200 OK` |
| `POST` | `/api/v1/seats/hold` | Temporarily hold a selected seat (10-minute TTL) | `201 Created` |
| `POST` | `/api/v1/orders` | Complete payment and confirm ticket order | `201 Created` |
| `GET` | `/api/v1/users/:id/tickets` | View a user's purchased tickets and history | `200 OK` |

---

## 4. Data Model Schema

### Four Required Entities & Relationships
1. **`users`**: Stores user authentication and profile data.
2. **`events`**: Stores concert information, venue details, and sale opening times.
3. **`seats`**: Represents individual seats linked to an event (`seat_id`, `event_id`, `seat_number`, `status`, `held_until`).
4. **`orders`**: Records completed purchases linking users to their booked seats.

### SQL Table Definitions
```sql
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    sale_start_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    seat_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'held', 'booked'
    held_until TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    UNIQUE (event_id, seat_number)
);

CREATE TABLE orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
);

## 5. Preventing Double-Booking (Concurrency Control)

TicketHub employs a three-tier defense mechanism to ensure **zero double-bookings** during high-concurrency ticket sales:

1. **Virtual Waiting Room (Rate Limiting Queue):** Incoming traffic during a major tour release is filtered through a Redis-backed token bucket queue, throttling requests to a sustainable throughput so the database never experiences connection exhaustion.
2. **Distributed Redis Locks with TTL:** When a user selects a seat, an atomic Redis operation (`SETNX`) sets a 10-minute hold. If another user attempts to hold the same seat, Redis rejects it immediately.
3. **Database ACID Transactions & Pessimistic Row-Level Locking:** During order submission (`POST /api/v1/orders`), the database executes an isolated transaction using pessimistic locking (`SELECT ... FOR UPDATE`):

```sql
BEGIN TRANSACTION;
SELECT status FROM seats WHERE seat_id = 42 FOR UPDATE;
-- Verifies status is 'available', then locks the row
UPDATE seats SET status = 'booked' WHERE seat_id = 42;
INSERT INTO orders (user_id, seat_id, total_amount) VALUES (1, 42, 120.00);
COMMIT;
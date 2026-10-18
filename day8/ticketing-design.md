# TicketHub System Architecture & Design Document

## 1. Requirements

### Functional Requirements
- Users can browse available concerts and events.
- Users can view real-time seat availability layouts (e.g., available, held, booked).
- Users can temporarily hold specific seats during checkout.
- Users can process payments and successfully purchase tickets.
- Users can view their purchased ticket history and digital passes.

### Non-Functional Requirements
- **Correctness & Fairness:** Zero tolerance for double-booking the same seat. Flash sales must be fair (first-come, first-served with a virtual waiting room).
- **Speed & Low Latency:** Event browsing and seat map rendering must load in under 200 ms.
- **High Availability & Scalability:** The system must withstand massive flash crowd traffic spikes when high-demand tickets go on sale without crashing.

---

## 2. Traffic Estimates

### A. Normal Daily Traffic
- **Registered Users:** 2,000,000
- **Daily Active Visitors:** 50,000 visitors/day
- **Page Views:** 50,000 visitors × 10 pages = 500,000 page views/day
  $$\frac{500,000 \text{ views}}{86,400 \text{ seconds}} \approx \mathbf{5.78 \text{ page views/sec}}$$
- **Ticket Sales:** 5,000 tickets sold/day
  $$\frac{5,000 \text{ sales}}{86,400 \text{ seconds}} \approx \mathbf{0.06 \text{ sales/sec}}$$

### B. "Big Sale" Flash Crowd Peak Traffic
- **Scenario:** 200,000 users attempt to buy 20,000 seats within the first 10 minutes (600 seconds).
- **Average Flash Sale Request Rate:**
  $$\frac{200,000 \text{ users}}{600 \text{ seconds}} \approx \mathbf{333.3 \text{ requests/sec}}$$
- **Peak Spike Multiplier (Stampede Moment at Drop):** Factoring in connection retries and simultaneous clicks when the countdown hits zero, peak traffic can surge up to **1,500 to 2,000 requests/sec**.

---

## 3. REST API Specification

| Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/events` | Browse and filter upcoming events | `200 OK` |
| `GET` | `/api/v1/events/:id/seats` | Get real-time seat map and availability | `200 OK` |
| `POST` | `/api/v1/seats/hold` | Temporarily hold a seat for checkout (10-min TTL) | `201 Created` |
| `POST` | `/api/v1/orders` | Complete payment and confirm ticket purchase | `201 Created` |
| `GET` | `/api/v1/users/:id/tickets` | View user's purchased tickets | `200 OK` |

---

## 4. Data Model Schema

### Entities & Relationships
1. **`users`**: Stores user account details and credentials.
2. **`events`**: Stores concert/event details, venue info, and sale start times.
3. **`seats`**: Represents individual physical seats mapped to an event (`seat_id`, `event_id`, `seat_number`, `status`).
4. **`orders`**: Records completed transactions linking users to their purchased seats.

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
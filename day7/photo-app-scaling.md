# SnapShare System Architecture & Scaling Plan

## 1. Core Assumptions & Daily Active Users (DAU)
- **Registered Users:** 10,000,000 (10 Million)
- **Daily Active User (DAU) Ratio:** 10% of total registered users
- **DAU Calculation:** 10,000,000 × 0.10 = **1,000,000 Daily Active Users**
- **User Activity per DAU:**
  - 1 photo upload per day
  - 50 feed views per day
- **File Sizes:**
  - Average original photo: 2 MB
  - Thumbnail photo: 50 KB (0.05 MB)
  - Total storage per photo: 2.05 MB

---

## 2. Estimates & Traffic Calculations

### A. Photo Uploads per Second
- **Total Uploads per Day:** 1,000,000 photos/day
- **Average Uploads per Second:**
  $$\frac{1,000,000 \text{ uploads}}{86,400 \text{ seconds}} \approx \mathbf{11.57 \text{ uploads/sec}}$$
- **Peak Uploads per Second (5× average multiplier):**
  $$11.57 \times 5 = \mathbf{57.85 \text{ uploads/sec}}$$

### B. Feed Views per Second
- **Total Feed Views per Day:** $1,000,000 \text{ users} \times 50 \text{ views} = 50,000,000 \text{ views/day}$
- **Average Feed Views per Second:**
  $$\frac{50,000,000 \text{ views}}{86,400 \text{ seconds}} \approx \mathbf{578.7 \text{ views/sec}}$$
- **Peak Feed Views per Second (5× average multiplier):**
  $$578.7 \times 5 \approx \mathbf{2,893.5 \text{ views/sec}}$$

### C. Storage Requirements per Year
- **Daily Storage (Original + Thumbnail):**
  $$1,000,000 \text{ photos/day} \times 2.05 \text{ MB} = 2,050,000 \text{ MB/day} \approx 2.05 \text{ TB/day}$$
- **Yearly Storage Requirement:**
  $$2.05 \text{ TB/day} \times 365 \text{ days} = \mathbf{748.25 \text{ TB/year}}$$

---

## 3. Read vs. Write System Characteristics
**SnapShare is a heavily READ-HEAVY system.**

With ~578.7 feed views per second compared to ~11.57 uploads per second, read requests outnumber write requests by a ratio of **50:1**. 

### Architectural Implications:
- The database layer must utilize aggressive caching (In-Memory Data Store like Redis) and Read Replicas so that read traffic does not bottleneck write operations.
- Static media (photos and thumbnails) must be served directly via a Content Delivery Network (CDN) to offload bandwidth from application servers.

---

## 4. Storage Strategy: Database vs. Object Storage
**Photos must NEVER be stored directly inside relational databases as BLOBs.** 

Storing large binary files inside relational databases causes severe database bloating, drastically increases backup/restore times, consumes expensive memory/disk I/O, and degrades indexing performance. Instead, binary image files are stored in cost-effective **Object Storage** (e.g., AWS S3), while the relational database only stores lightweight string metadata references (e.g., photo URL, user ID, timestamp, captions).

---

## 5. System Architecture Diagram

---

## 6. Component Explanations

1. **CDN (Content Delivery Network):** Caches and serves static photo files from edge locations geographically close to users to minimize latency and reduce origin server bandwidth.
2. **Load Balancer:** Distributes incoming HTTP traffic evenly across multiple application server instances to prevent any single server from overloading.
3. **App Servers:** Executes core business logic, handles user authentication, processes API requests, and coordinates database and storage workflows.
4. **Cache (In-Memory Store / Redis):** Stores frequently accessed user feed items and session data in RAM to deliver sub-millisecond read responses without hitting the database.
5. **Primary Database:** Handles all write operations (creating users, saving photo metadata records) while enforcing ACID compliance and relational integrity.
6. **Read Replica Database:** Asynchronously replicates data from the Primary DB to serve read-only queries (fetching profile info, user followers), taking read load off the primary database.
7. **Object Storage (e.g., S3):** Stores raw unstructured binary image data securely at scale with high durability and low cost.
8. **Message Queue (e.g., RabbitMQ / Kafka):** Buffers photo processing jobs asynchronously so high-latency tasks like thumbnail generation do not block the user API response.
9. **Worker Service:** Consumes jobs from the Message Queue in the background to fetch original images, resize them into 50 KB thumbnails, and upload them back to Object Storage.

---

## 7. Step-by-Step Photo Upload Flow

1. **User Request:** The client app sends an HTTP `POST` request containing photo binary data and metadata (caption, location) to the Load Balancer, which routes it to an active App Server.
2. **Direct Storage:** The App Server writes the original 2 MB photo file directly into Object Storage and receives a unique file URL in return.
3. **Queue Notification:** The App Server publishes an asynchronous event containing the photo URL and `photo_id` to the Message Queue.
4. **Immediate API Response:** The App Server writes the initial photo record (User ID, original photo URL, status: pending) into the Primary DB and immediately responds `201 Created` to the user so the UI isn't kept waiting.
5. **Background Processing:** A Worker Service pulls the job from the Message Queue, downloads the original photo, resizes it into a 50 KB thumbnail, and uploads the thumbnail to Object Storage.
6. **Database & Cache Update:** The Worker updates the photo record in the Primary DB with the thumbnail URL and invalidates/updates relevant user feed caches so followers see the new post.

---

## 8. Architectural Trade-offs

1. **Asynchronous Processing vs. Instant Thumbnail Consistency:**
   * **Trade-off:** By processing thumbnails asynchronously using a queue, users get instant upload confirmation. However, if a user reloads their feed within a split second, the thumbnail might still be processing and temporarily show a loading placeholder (Eventual Consistency).
2. **Read Replica Asynchronous Replication Latency:**
   * **Trade-off:** Using a Read Replica database drastically increases
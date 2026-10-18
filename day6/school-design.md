# School Database Design & Explanation

## Table Explanations & Relationships

1. **`students`**: Stores core information about individual students, including `student_id` (Primary Key), `name`, and a `UNIQUE` `email` address.
2. **`courses`**: Stores information about available academic courses, including `course_id` (Primary Key), `title`, and a `UNIQUE` course `code`.
3. **`enrolments`**: Serves as a **join table** linking students to their enrolled courses while recording context-specific attributes such as `grade`.

### Relationships
* **One-to-Many Relationships**:
  * One student can have many enrolments (`students` to `enrolments`).
  * One course can have many enrolments (`courses` to `enrolments`).
* **Many-to-Many Relationship**:
  * The relationship between `students` and `courses` is **many-to-many**, because a single student can enroll in multiple courses, and a single course can enroll multiple students.
* **Why a Join Table is Needed**:
  Relational databases cannot directly implement a many-to-many relationship using simple foreign keys on either main table without creating severe data duplication and schema design violations. The `enrolments` join table breaks down the many-to-many relationship into two manageable one-to-many relationships and provides a distinct place to store enrolment-specific attributes like `grade`.

---

## Performance Optimization (Indexes)

* **Proposed Index**: `CREATE INDEX idx_enrolments_student ON enrolments(student_id);`
* **Reason**: Queries fetching a student's course list or joining enrolments with student data frequently filter or join on `student_id`. Indexing `student_id` on the `enrolments` table drastically speeds up query execution as the number of enrolment records grows large.

---

## SQL vs NoSQL Architectural Choice

For an academic management system, **SQL (Relational Database)** is the optimal choice. School administrative systems require strict data integrity, normalized relational modeling, complex queries across multiple entities (joining students, courses, grades, and schedules), and ACID transactional compliance (preventing duplicate enrolments or orphan records). While NoSQL excels at unstructured data and massive horizontal scaling, the relational, structured nature of school enrollment data benefits heavily from SQL's strict constraints and powerful join capabilities.
# Database Schema

This schema defines tables and relationships for a resource management system: users, resources, sensors, events, reservations, auditing, and statistics.  
**Comment styles:**  
- `//` are inline explanations  
- Indexes and references are described for clarity.

---

## Table: `users`
| Column      | Type        | Details                             |
|-------------|-------------|-------------------------------------|
| id          | `uuid`      | Primary Key                         |
| name        | `text`      |                                     |
| email       | `text`      | Unique                              |
| role        | `varchar`   | `'student'`, `'faculty'`, `'admin'` |
| created_at  | `timestamp` |                                     |
| updated_at  | `timestamp` |                                     |

---

## Table: `resources`
| Column         | Type        | Details                                                   |
|----------------|-------------|-----------------------------------------------------------|
| id             | `uuid`      | Primary Key                                               |
| resource_type  | `varchar`   | e.g. `'parking_spot'`, `'library_seat'`, `'meeting_room'` |
| name           | `text`      |                                                           |
| location       | `text`      |                                                           |
| is_active      | `boolean`   |                                                           |
| created_at     | `timestamp` |                                                           |

---

## Table: `sensors`
| Column            | Type        | Details                                   |
|-------------------|-------------|-------------------------------------------|
| id                | `uuid`      | Primary Key                               |
| resource_id       | `uuid`      | References `resources(id)`                |
| sensor_identifier | `text`      | Hardware ID or MAC address                |
| sensor_type       | `varchar`   | `'motion'`, `'weight'`, `'infrared'`      |
| installed_at      | `timestamp` |                                           |
| status            | `varchar`   | `'active'`, `'faulty'`, `'maintenance'`   |

---

## Table: `occupancy_events`
| Column       | Type        | Details                        |
|--------------|-------------|--------------------------------|
| id           | `uuid`      | Primary Key                    |
| resource_id  | `uuid`      | References `resources(id)`     |
| sensor_id    | `uuid`      | References `sensors(id)`       |
| status       | `varchar`   | `'occupied'`, `'free'`         |
| recorded_at  | `timestamp` |                                |

**Indexes:**
- `(resource_id, recorded_at)`
- `(sensor_id, recorded_at)`

---

## Table: `reservations`
| Column         | Type        | Details                                                |
|----------------|-------------|--------------------------------------------------------|
| id             | `uuid`      | Primary Key                                            |
| user_id        | `uuid`      | References `users(id)`                                 |
| resource_id    | `uuid`      | References `resources(id)`                             |
| reserved_from  | `timestamp` |                                                        |
| reserved_until | `timestamp` |                                                        |
| status         | `varchar`   | `'pending'`, `'confirmed'`, `'cancelled'`, `'expired'` |
| created_at     | `timestamp` |                                                        |

**Indexes:**
- `(user_id)`
- `(resource_id)`
- `(reserved_from, reserved_until)`

---

## Table: `audit_logs`
| Column      | Type        | Details                                            |
|-------------|-------------|----------------------------------------------------|
| id          | `uuid`      | Primary Key                                        |
| user_id     | `uuid`      | References `users(id)`                             |
| action      | `varchar`   | `'login'`, `'reserve'`, `'cancel'`, `'admin_edit'` |
| resource_id | `uuid`      | References `resources(id)`, nullable               |
| timestamp   | `timestamp` |                                                    |
| details     | `jsonb`     | Store context/metadata                             |

**Indexes:**
- `(user_id, timestamp)`
- `(resource_id, timestamp)`
- `(action, timestamp)`

---

## Table: `resource_usage_stats`
| Column                 | Type        | Details                    |
|------------------------|-------------|----------------------------|
| id                     | `uuid`      | Primary Key                |
| resource_id            | `uuid`      | References `resources(id)` |
| date                   | `date`      |                            |
| total_reservations     | `int`       |                            |
| avg_occupancy_duration | `float`     |                            |
| peak_usage_time        | `timestamp` |                            |

**Indexes:**
- `(resource_id, date)`

---

## Table: `sensor_readings`
| Column        | Type        | Details                           |
|---------------|-------------|-----------------------------------|
| id            | `uuid`      | Primary Key                       |
| sensor_id     | `uuid`      | References `sensors(id)`          |
| reading_time  | `timestamp` |                                   |
| value         | `numeric`   |                                   |
| payload       | `jsonb`     |                                   |

**Indexes:**
- `(sensor_id)`
- `(reading_time)`
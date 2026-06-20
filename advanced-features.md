# Advanced Features — MVP 4: Community

## Overview

A community/forum layer where any registered user can join topic-based communities, post threads, and reply in public comment threads. Approved talents get a special badge visible on their profile and throughout the community, establishing credibility and helping users find experts.

---

## 1. User Tiers

- **Regular User** — Can join communities, post threads, and reply to others. No special badge.
- **Approved Talent** — Has a completed talent profile (avatar, bio, demos, social links). Gets a **talent badge** displayed next to their name on:
  - Their profile page
  - Every community post or reply they make
  - The talent directory cards

---

## 2. Communities (Categories)

A set of topic-based communities. Users can browse and join any of them.

### Planned Communities
- Mixing & Mastering
- Event Photography
- Sound Engineering
- Portrait Photography
- Music Production
- Studio Equipment
- Live Sound
- Video Production
- Podcasting
- General Discussion

### Database Table: `communities`
| Column       | Type         | Notes                          |
|--------------|--------------|--------------------------------|
| id           | INT PK       | Auto-increment                 |
| name         | VARCHAR(255) | Display name                   |
| slug         | VARCHAR(255) | URL-friendly identifier        |
| description  | TEXT         | Brief description              |
| icon         | VARCHAR(50)  | Optional icon identifier       |
| created_at   | TIMESTAMP    |                                |

### Database Table: `community_members`
| Column       | Type         | Notes                          |
|--------------|--------------|--------------------------------|
| id           | INT PK       | Auto-increment                 |
| community_id | INT FK       | References communities.id      |
| user_id      | INT FK       | References users.id           |
| joined_at    | TIMESTAMP    |                                |
| UNIQUE       | (community_id, user_id) | One join per user per community |

---

## 3. Threads (Posts)

Any community member can create a new thread within a community.

### Database Table: `community_threads`
| Column       | Type         | Notes                          |
|--------------|--------------|--------------------------------|
| id           | INT PK       | Auto-increment                 |
| community_id | INT FK       | References communities.id      |
| user_id      | INT FK       | References users.id (author)   |
| title        | VARCHAR(255) | Thread title                   |
| content      | TEXT         | Main post body                 |
| created_at   | TIMESTAMP    |                                |
| updated_at   | TIMESTAMP    |                                |

---

## 4. Replies (Comments)

YouTube-style public comment threads. Anyone can reply to a thread, and replies appear chronologically.

### Database Table: `community_replies`
| Column       | Type         | Notes                          |
|--------------|--------------|--------------------------------|
| id           | INT PK       | Auto-increment                 |
| thread_id    | INT FK       | References community_threads.id|
| user_id      | INT FK       | References users.id (author)   |
| content      | TEXT         | Reply body                     |
| parent_id    | INT FK       | Nullable — references another reply for nested replies |
| created_at   | TIMESTAMP    |                                |
| updated_at   | TIMESTAMP    |                                |

---

## 5. Badge System

- `talent_profiles` already has the data needed (avatar, status).
- When rendering any user's name in community threads or replies, check if they have an approved talent profile.
- If yes, display a small badge/label (e.g., "🎚️ Talent" or a styled badge) next to their name.
- The badge links to their public talent profile page.

---

## 6. Profile Pages

### Talent Profile Page (`/talent/[id]`)
- Already being built in MVP 3 Phase 2
- Shows: avatar, name, bio, social links, demo files
- **Future addition**: "Recent Community Activity" section showing recent threads and replies by this talent

### User Profile Page (future)
- Shows: username, avatar, joined date
- Community membership badges
- Recent threads and replies

---

## 7. API Routes (Planned)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/communities | No | List all communities |
| GET | /api/communities/:slug | No | Get community with threads |
| POST | /api/communities/:id/join | Yes | Join a community |
| DELETE | /api/communities/:id/leave | Yes | Leave a community |
| GET | /api/communities/:id/threads | No | List threads in a community |
| POST | /api/communities/:id/threads | Yes | Create a new thread |
| GET | /api/threads/:id | No | Get thread with replies |
| POST | /api/threads/:id/replies | Yes | Reply to a thread |
| PATCH | /api/threads/:id | Yes (owner) | Edit thread |
| DELETE | /api/threads/:id | Yes (owner/admin) | Delete thread |
| PATCH | /api/replies/:id | Yes (owner) | Edit reply |
| DELETE | /api/replies/:id | Yes (owner/admin) | Delete reply |

Admin-only:
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/admin/communities | Admin | Create community |
| PATCH | /api/admin/communities/:id | Admin | Edit community |
| DELETE | /api/admin/communities/:id | Admin | Delete community |

---

## 8. Frontend Pages (Planned)

- `/community` — Browse all communities (grid of cards)
- `/community/[slug]` — Community detail page with thread list
- `/community/[slug]/new` — Create a new thread (authenticated)
- `/thread/[id]` — Thread detail with replies (YouTube-style comment tree)
- `/talent/[id]` — Public talent profile (Phase 2, extended with community activity)

---

## 9. Design Notes

- Use existing retro design system (same Tailwind classes, fonts, borders)
- Thread list: title, author (with badge), reply count, latest reply time
- Replies: chronological, avatar + name (with badge if talent), timestamp, content
- Mobile responsive (same as existing pages)

---

## 10. Implementation Order

1. **Phase 4.1**: Database tables + init-db migration
2. **Phase 4.2**: Backend API routes (communities, threads, replies)
3. **Phase 4.3**: Frontend — community browse + community detail + thread pages
4. **Phase 4.4**: Badge integration + talent profile community activity section
5. **Phase 4.5**: Admin community management pages
6. **Phase 4.6**: Polish (pagination, search, notifications)

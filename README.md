## Friendship Orbit – Next.js + SQLite

The original standalone mock lives in `legacy/` (`index.html` + `script-complete.js`). Everything else is a **Next.js 16 App Router** app with **SQLite** via `better-sqlite3`.

### Routes

| Path | Purpose |
|------|---------|
| `/` | redirects to `/orbit` |
| `/orbit` | Draggable orbit, add friends, user avatar upload |
| `/friends` | List + edit modal |
| `/analytics`, `/timeline`, `/insights`, `/compare` | Same conceptual tabs as the mock |
| `/groups` | Constellations (`groups` + `group_members` tables) |

JSON API:`/api/app`, `/api/friends`, `/api/friends/[id]`, `/api/friends/[id]/orbit`, `/api/profile`, `/api/groups`, `/api/groups/[id]`, `/api/export`, `/api/reset`.

### Database

- First run (empty DB) seeds **demo friends**, **timeline history**, and **three constellation groups**. Delete `data/friendship-orbit.db` to re-seed after `npm run dev`.
- Custom path:`DATABASE_PATH=/abs/path.sqlite npm run dev`

### Scripts

```bash
npm install
npm run dev
npm run build
npm start
```

After `npm install`, `postinstall` runs `npm rebuild better-sqlite3` so the native addon matches your **current** Node.js ABI. If you upgrade Node and see `NODE_MODULE_VERSION` / `ERR_DLOPEN_FAILED`, run:

```bash
npm rebuild better-sqlite3
```

### Deploy notes

SQLite is filesystem-local — use a writable volume / persistent disk on your host or pick another store for serverless multi-instance setups.

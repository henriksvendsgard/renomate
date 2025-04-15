# 🛠️ Oppuss – Room-by-Room Renovation Planner (PWA)

**Oppuss** is a minimalist and collaborative renovation planning app designed for couples or homeowners. Built as a PWA, it works offline and syncs your renovation tasks, budgets, and progress room by room.

---

## 📐 Features

-   🏡 **Room Overview**: View each room with budget, tasks, and deadlines.
-   ✅ **Tasks**: Add, check off, and comment on subtasks per room.
-   💸 **Budgets**: Track spending per room and per task.
-   📸 **Photos**: Upload before/after images for each room.
-   ⏰ **Timeline**: Set and follow deadlines for each task or room.
-   📦 **Offline Support**: Full offline mode using localStorage/IndexedDB.
-   ☁️ **Optional Sync**: Hook up Supabase for auth + real-time sync.

---

## 🧠 Tech Stack

-   **Framework**: [SvelteKit](https://kit.svelte.dev/)
-   **Styling**: Tailwind CSS + custom palette
-   **State**: Writable stores or local component state
-   **Storage**: IndexedDB (via `idb` or `dexie`) / Supabase (optional)
-   **PWA**: `@vite-pwa/sveltekit` for service worker + offline support

---

## 🎨 Color Palette

| Purpose        | Name     | Hex       |
| -------------- | -------- | --------- |
| Primary        | Sand     | `#D8CAB8` |
| Accent         | Clay     | `#9E7C5D` |
| Text           | Charcoal | `#2E2E2E` |
| Contrast       | Snow     | `#FDFCF9` |
| Active/Success | Pine     | `#4B635E` |

> Configure these in your `tailwind.config.cjs` under `theme.extend.colors`.

---

## 🧱 Component Guidelines

-   Keep components atomic: `RoomCard.svelte`, `TaskList.svelte`, `PhotoUploader.svelte`, etc.
-   Use Tailwind utility classes (avoid custom CSS unless needed).
-   Group components by domain:  
    /src/lib/components/room/ /src/lib/components/task/


---

## 🗂️ Data Models

```ts
// src/lib/types.ts

export type Room = {
id: string
name: string
budget: number
deadline: string
photos: string[] // base64 or URL
tasks: Task[]
}

export type Task = {
id: string
title: string
done: boolean
note?: string
cost?: number
}


🧭 Routing Structure
/               → Dashboard (overview of all rooms)
/room/[roomId]  → Room detail page
/settings       → App settings (theme, sync, etc.)


🧰 Development Notes
Use optimistic UI updates for task completion

Add subtle animations with svelte:transition

Prioritize accessibility (aria labels, keyboard nav, alt text)

Prompt install on mobile for full PWA experience

Add before/after photo comparison if possible

📦 Optional Enhancements
Supabase Auth + Database for cloud sync

QR code-based room sharing

Push notifications for reminders (via service worker)

Made with ❤️ by two people renovating their first home together.
```

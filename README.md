# 📓 RPG Diary & Memory

An extension for SillyTavern designed to provide your roleplay with **long-term memory** capabilities.

The extension helps the AI character keep first-person diary entries and automatically builds a structured dossier of **events, NPCs, locations, gifts, and glossary terms**. It tracks relationship development over time and feeds this information back to the AI invisibly—helping maintain continuity even after the context window fills up or when starting a brand-new chat.

Part of the **Tavern RPG Suite**. It integrates with `window.RPG.vitals` (health/conditions) and `window.RPG.scene` (in-game date, time, weather, location) when those modules are installed.

**Current Version:** 3.8.8

---

## 🚀 Installation

### How to Install
* **Via SillyTavern:** Go to *Extensions* ➡️ *Install extension* ➡️ Paste this repository's URL.
* **Manually:** Clone or extract the folder into `SillyTavern/data/<user>/extensions/` and reload the application.

### Setup
1. Open the extension settings and check **Enable Diary**.
2. Configure an OpenAI-compatible API (such as OpenRouter) with your API URL, key, and preferred model.
3. A **book icon** will appear on the right edge of the screen inside active chats. Click it to open the diary interface, and drag the window header to reposition it.

### Requirements
* A recent version of SillyTavern.
* An OpenAI-compatible API for processing summaries.
* *(Optional)* **RPG Scene Card (≥ 1.5.0)** for in-game time tracking, and **RPG Vitals** for automatic health/condition tracking. Without these, the system defaults to real-world system dates.

---

## 🛠️ Main Features & Actions

| Button | Action |
| :--- | :--- |
| ✨ **Summarize chat** | **Incremental update** — scans only the messages added since the last summary and merges them into the existing memory and dossier. (Recommended for regular use). |
| 🔄 **Full re-summarize**| **Complete rebuild** — re-reads the entire chat from message #1. Use this if memory data appears out of sync or after a major update. |
| ✍️ **Write entry (AI)** | Instructs the character to write a short first-person diary entry about recent events (utilizes RPG Vitals data if available). |
| ⚠️ **Check** | **Continuity check** — compares the recent scene against saved facts to detect potential contradictions (e.g., forgotten secrets, inactive conditions, or deceased characters appearing). |
| 🔀 **Merge** | Combines two or more saved memories (even from different chats) into a single, consistent memory file. |
| ➡️ **Continue from...** | Imports a saved memory and its complete dossier into the current chat to carry over an existing story. |
| ➕ **Add** | Allows you to manually add a custom entry to the diary. |

*Note: The summarization process is designed to handle very long chat logs by processing the text in manageable chunks.*

### Automatic Merging (No Duplicates)
The system is built to update existing records rather than duplicate them. If an NPC or location already exists in the dossier and new information is detected later in the chat, the extension merges the new details into the existing entry. Old information is preserved, and new text is appended or updated without erasing prior context.

---

## 🗂️ Core Tabs

* 📔 **Diary** — First-person entries and a **bond meter** tracking how the character feels about you, complete with a relationship drift graph.
* 📅 **Events** — A chronological log of what happened, when, where, and the key participants.
* 👥 **NPCs** — Role, description, introduction details, relationship levels, and a **relationship-drift sparkline**.
* 📍 **Locations** — Details on explored places.
* 🎁 **Gifts** — Log of items exchanged, including who gave them and why.
*  **Glossary** — Explanations of world terms, lore, and custom terminology.
* 📝 **Notes** — Private notes that are hidden from the AI prompt by default unless explicitly enabled.

*All entries support manual editing, image attachments (via URL or local file upload), and a live search filter.*

---

## 💾 Memory Management

The **Memory** tab shows exactly what is sent to the AI, including word count and message coverage tracking.

* **Edit Memory:** Manually adjust the plain text summary at any time.
* **Lock Text:** Freeze the main memory text to prevent automated summaries from overwriting your manual edits. Dossiers (NPCs, events, etc.) will continue to update normally.
* **Version History:** Revert to previous snapshots if an automated summary misses important details.
* **Saved Memories Library:** Rename, delete, or load historical memory states.

---

## ❤️ Relationship & Bond Tracking

The system tracks relationship metrics over time. 
* The **bond meter** displays the focus character's trust level and status.
* Each NPC card includes a **drift sparkline** showing how their relationship has developed. 
* A automatic warning appears if a character's relationship level drops significantly below its historical peak, indicating a potential regression in the AI's behavior. These levels are injected into the context on each turn to help maintain relationship consistency.

---

## 📌 Pinning (Critical Information)

Every card in the dossier features a **📌 Pin** button. Pinned facts are injected into the AI's prompt on **every single turn**, regardless of the current scene. Use this feature for critical, unchanging facts that the AI must never forget (e.g., a hidden identity, a major outstanding contract, or an active disguise).

---

## 🔍 Retrieval Mechanics

The extension injects memory context invisibly into the prompt. You can choose to place it at a specific depth in the recent context, as a header at the start of the chat, or both.

### What is retrieved each turn:
1. **Pinned Facts:** Always injected.
2. **Entity Triggers:** If an NPC, location, or item name is mentioned in the recent messages, its dossier entry is automatically included.
3. **Best Matches:** Highly relevant entries are selected using search algorithms.
4. **Relationship Anchors:** Current relationship levels and trust statuses are injected to prevent character resets.

### Retrieval Methods:
* **Keyword Search (BM25):** The default search method, optimized for both English and multilingual text.
* **Vector RAG (Optional):** Uses vector embeddings to match entries by meaning rather than exact keywords. This allows the system to match concepts across different languages.
* **Raw Scene Recall:** Optionally indexes the raw chat log in dated chunks to quote past dialogues back to the AI word-for-word when relevant.

---

## 🔄 Chat Portability & Carry-Over

Each chat maintains its own isolated diary. To carry progress over to a new chat, you can use the following methods:

* **Continue from... (Manual):** Manually import a saved memory dossier (events, NPCs, locations, gifts, and bonds) into the new chat.
* **Auto-carry memory (Settings):** Configure the system to automatically carry memory over to new chats (options: *Never*, *Same Character Only*, or *Any Chat*).
* **Verbatim Scene Archive:** Option to carry over the exact historical chat logs for direct quotation.

---

## 📥 Import & Export

* **Export / Import (Single Chat):** Save or load a single chat's diary data as a JSON file.
* **Export / Import (All Chats):** Save or load all diaries and your saved memory library in a single consolidated backup.

---

## 🤖 Automation

* **Auto-summarize:** Automatically triggers a summary update when a new in-game day begins (requires RPG Scene Card).
* **Auto-write diary:** Automatically generates a first-person diary entry at specified in-game day intervals.

---

## 👥 Group Chats

The extension fully supports group chats. The diary is saved per group, and summarization processes messages from all active participants. You can select the primary "focus character" using the edit icon next to the byline on the Diary tab.

---

## 💻 Cross-Extension Developer Bridge

Other extensions can interface with the diary using the following global methods:

```js
window.RPG.diary.addEntry({ text, mood, tags, loc })
window.RPG.diary.addEvent({ title, when, where, who, what })
window.RPG.diary.addNpc({ name, role, look, how_met, note, trust })
window.RPG.diary.addGift({ dir:'out'|'in', item, who, when, why })
window.RPG.diary.addLocation({ name, desc })
window.RPG.diary.revealLocation('Location Name')
window.RPG.diary.getSummary()     // Returns current memory text
window.RPG.diary.summarizeNow()   // Triggers an immediate summary run
```

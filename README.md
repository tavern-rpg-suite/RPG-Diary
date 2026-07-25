# RPG Diary & Memory

A leather diary for SillyTavern that gives your roleplay a **long-term memory**.

The character keeps first-person entries; the extension builds a factual dossier of **events, NPCs,
locations, gifts and glossary**; it tracks how the relationship actually developed; and it feeds all of that
back to the AI *invisibly* — so nothing important is lost when the context window fills up, and a **brand-new
chat can remember the whole story**.

Part of the **Tavern RPG Suite**. Reads `window.RPG.vitals` (health / conditions) and `window.RPG.scene`
(in-game date, time, weather, location) when those modules are installed.

**Version 3.8.6**

---

## Install

**From SillyTavern:** *Extensions → Install extension* → paste this repo's URL.
**Manually:** drop the folder into `SillyTavern/data/<user>/extensions/` and reload.

Then: extension settings → tick **Enable Diary** → fill in **AI (OpenRouter)**: API URL, key, model.

A **book button** appears on the right edge of the screen *inside a chat* (not on the home screen), with the
other suite buttons. Click it to open the diary, click again to close. Tap the cover to open the book; drag
the window by its header.

### Requirements

- SillyTavern (recent version).
- An OpenAI-compatible API for the summaries — OpenRouter works out of the box.
- Optional: **RPG Scene Card ≥ 1.5.0** for in-game dates/weather/locations, **RPG Vitals** for health in
  entries. Everything works without them, just with system dates instead of game dates.

---

## The buttons on the Diary tab

| Button | What it does |
|---|---|
| **✦ Summarize chat** | **Incremental** — reads only the messages added *since last time* and merges them into the existing memory and dossier. This is the one you normally press. |
| **⟲** | **Full re-summarize** — re-reads the entire chat from message #1 and rebuilds everything. Slow; use after an upgrade or if the memory looks wrong. |
| **✎ Write entry (AI)** | The character writes a short first-person diary entry about the recent scene (uses HP/conditions from Vitals if present). |
| **⚠ Check** | **Continuity check** — compares the recent scene against your established facts and reports contradictions (a forgotten disguise, an ignored debt, a dead character speaking…). |
| **⚯ Merge** | Fuses two or more saved memories (even from different chats) into one consistent memory. The result becomes **this chat's** memory and is saved to the library. |
| **⇥ Continue from…** | Pulls a saved memory — *and its whole dossier* — into **this chat only**. This is how a new chat remembers an old story. |
| **＋ Add** | Add an entry by hand. |

Both summarize modes handle chats far larger than your context limit (e.g. 60k with a 20k window): the chat
is read in parts and reduced into one memory.

### Updating vs. duplicating

Records are **updated, never duplicated**. If Mari is already in the dossier and new facts about her appear
200 messages later, the extension passes the existing dossier to the AI (so it returns an *extended* Mari),
matches her by name, and **merges the fields additively** — new text that contains the old replaces it,
genuinely new text is appended, and a poorer version can never erase what you already knew. Same for events
(by title), locations (by name), gifts (item + who) and glossary terms.

---

## Tabs

- **Diary** — first-person entries, plus a **bond meter**: how the main character currently feels about you,
  with a drift graph.
- **Events** — the factual backbone: what happened, when, where, who, cause → consequence.
- **NPCs** — role, appearance, how you met, relationship %, notes, and a **relationship-drift sparkline**.
- **Locations** · **Gifts** (what changed hands, from whom, why) · **Glossary** (world terms).
- **Notes** (right page of the Glossary tab) — private; the AI never sees them unless you opt in.

Everything is editable by hand. **Pictures** can be attached to entries, events, NPCs and locations — paste an
image URL or click **📁 File** (auto-shrunk so it won't bloat your save). A **live search box** filters
entries, events and people as you type.

---

## The Memory tab

See exactly what the AI is being told. The tab shows the memory text in full, how many words it is, and how
many messages it covers (`47/120 · 73 new, not summarized yet`). From here you can:

- **✎ Edit memory** — it's plain text; fix or add anything by hand.
- **🔓 Lock text** — freeze the memory so summarizing stops rewriting it. Events, NPCs, gifts and relationships
  keep updating as usual; the AI's proposed rewrite is kept as a **draft** you can accept, append or discard.
- **Version history** — every summarize snapshots the previous text. If the AI drops something, restore the
  old version with ⟲. A big shrink also raises a warning.
- **Saved memories library** — rename, delete or pull any memory into this chat.

## Bonds tab

Tracks how everyone actually feels. The focus character's bond with you (level + status line) sits on top,
then every NPC with a relationship level. Each has a **drift sparkline** showing how the bond developed, plus
a warning if someone cooled sharply (25+ points below their peak) — a sign the AI regressed them. These levels
are also injected every turn with an explicit "do not regress" instruction.

## 📌 Pinning — the "never forget this" button

Every card has a **📌 Pin** button. Pinned facts are sent to the AI **every single turn**, no matter what the
scene is about, and are marked as standing truths. Use it for the things that must never slip: *she's
disguised as a man*, *the debt to Diluc and how it must be worked off*, *who must not find out*.

---

## Memory & retrieval

**Hidden injection.** Memory reaches the AI invisibly — you never see it in the chat log. Placement: *at depth
in recent context*, *as a header at chat start*, or both.

**Collect-only mode.** Untick **Feed memory to the AI** to keep the diary filling up while injecting *nothing*
into the prompt — useful while your context is still roomy.

**What gets retrieved each turn:**

1. **Pinned facts** — always.
2. **Entity triggers** — if a name is mentioned right now (an NPC, a place, a gift), that dossier is force-fed
   to the AI, so the character actually remembers Mari the moment Mari comes up.
3. **Best matches** — ranked and kept varied, so five diary entries can't crowd out the one event that matters.
4. **Relationship anchors** — established trust levels ("Rufus: 90/100 — in love, protective") with an explicit
   instruction not to regress them.

Every retrieved piece carries **its date** and, with the Scene Card installed, a *"N days earlier"* note; the
current in-game date sits on top — so the AI knows *when* each memory happened.

**Ranking:**
- **Keyword (BM25)** by default — self-contained, works in **English and Russian** alike.
- **Vector RAG (optional)** — tick *Use vector embeddings* and give an `/embeddings` endpoint (blank URL/key
  reuses your main API). Matches by *meaning*; multilingual models can even match a Russian query to an English
  memory. Falls back to keyword search automatically if the endpoint fails.
- Both are **fused** when embeddings are on, so results that score well on either float up.

**Recalling raw scenes.** The extension also indexes the chat itself, in dated chunks. When an old scene
becomes relevant, it's quoted back to the AI **word-for-word** ("Recalled scene [12 Oct · 6 days earlier] …").
The last ~30 messages are skipped — they're already in context, so nothing is wasted. Tune this under
**Recall raw scenes from the chat**.

---

## Relationship drift

Trust levels are tracked over time. The NPC card and the Diary tab show a **sparkline** of how the bond
developed, and if a character **cools sharply** (25+ points below their peak), a warning appears — a signal
that the AI may have regressed them. The established levels are also injected every turn, which is the main
defence against a character resetting to a cold stranger.

---

## Chats, carry-over and different plots

**Every chat has its own diary.** Nothing leaks between chats, so you can run ten very different plots with
the same character.

Carrying memory into a new chat is **manual by default**:

- **⇥ Continue from…** — pick a saved memory; it is attached to **this chat only**. This copies the whole
  structured dossier into the new chat's book: **events, NPCs (with trust), locations, gifts, glossary, the
  bond, and pins**. They appear on the tabs, are searchable, and feed the AI. (Portraits and the personal diary
  entries stay in the source chat.)
- **Auto-carry memory into new chats** (settings): *Never (manual only)* — the default — *Only chats with the
  SAME character*, or *Any new chat*.
- **Carry a verbatim scene archive** (optional) — lets the new chat quote the original scenes word-for-word,
  not just the summary. Costs more space, so it's off by default.

**Saved-memory library.** Each summary is saved with an AI-written title. In the picker you can **rename** (✎)
or **delete** (✕, with confirmation) memories. Deleting a memory never touches your chat diaries.

---

## Import / Export

- **⤓ Export this chat / ⤒ Import into this chat** — one chat's diary as JSON.
- **⤓⤓ Export ALL chats / ⤒⤒ Import ALL chats** — every diary plus the memory library in one file. Import
  **merges**: chats with the same id are overwritten, everything else is kept.

---

## Automation

- **Auto-summarize on a new in-game day** — fires once on the first message of a new game day (from the Scene
  Card). A time-skip across several days fires **once**, not once per day.
- **Auto-write a diary entry every N game-days** — same trigger, in-character entry instead.
- Without the Scene Card there's no day number, so auto-runs stay off.

---

## Group chats

Works in groups: the diary is stored per group chat and summarization reads every participant's lines. Since a
group has no single "character", set **whose diary it is / the focus character** with the ✎ next to the byline
on the Diary tab.

---

## Cross-extension bridge

```js
window.RPG.diary.addEntry({ text, mood, tags, loc })
window.RPG.diary.addEvent({ title, when, where, who, what })
window.RPG.diary.addNpc({ name, role, look, how_met, note, trust })
window.RPG.diary.addGift({ dir:'out'|'in', item, who, when, why })
window.RPG.diary.addLocation({ name, desc })
window.RPG.diary.revealLocation('Whispering Woods')
window.RPG.diary.getSummary()     // this chat's memory text
window.RPG.diary.summarizeNow()   // run a summarization
```

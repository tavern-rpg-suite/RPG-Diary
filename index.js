import { getContext, extension_settings } from '../../../extensions.js';
import { eventSource, event_types, saveSettingsDebounced, saveSettings as stSaveSettings, setExtensionPrompt, extension_prompt_roles } from '../../../../script.js';

const MODULE_NAME = 'rpg_diary';
const PROMPT_KEY = 'rpg_diary_memory';
const GRADE_MAX = 5;

/* ============================================================ ICONS */
function I(p, w) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w || 1.6}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`; }
const G = {
    book: '<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h11"/>',
    user: '<circle cx="12" cy="9" r="4"/><path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    gift: '<path d="M4 9h16v11H4zM4 9l1-4h14l1 4M12 5v15"/>',
    gloss: '<path d="M4 5h16M4 12h16M4 19h10"/>',
    heart: '<path d="M12 21s-7-4.6-9-9C1.5 8 3.2 5 6 5c2 0 3 1 4 2.3C11 6 12 5 14 5c2.8 0 4.5 3 3 7-2 4.4-9 9-9 9z"/>',
    spark: '<path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    pin: '<path d="M12 21s-6-5-6-10a6 6 0 0 1 12 0c0 5-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>',
    tavern: '<path d="M4 10h16v10H4zM4 10l2-5h12l2 5M9 20v-5h6v5"/>',
    clinic: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M12 9v6M9 12h6M8 6V4h8v2"/>',
    school: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M6 10v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
    alley: '<path d="M6 21V6l6-3 6 3v15M9 21v-6h6v6"/>',
    roof: '<path d="M3 12l9-7 9 7M6 10v10h12V10"/>',
    key: '<circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M18 18l2-2"/>',
    home: '<path d="M3 11l9-7 9 7M6 10v9h12v-9"/>'
};
const LOC_ICONS = ['pin', 'tavern', 'clinic', 'school', 'alley', 'roof', 'home', 'map', 'key'];

/* ============================================================ I18N */
const I18N = {
    en: {
        btn_open: 'Diary', close: 'Close',
        cover_title: 'Diary', cover_sub: 'PERSONAL RECORDS · GATHERED BY RAG', cover_hint: 'tap to open',
        tab_diary: 'Diary', tab_evt: 'Events', tab_npc: 'NPCs', tab_loc: 'Locations', tab_gift: 'Gifts', tab_gloss: 'Glossary',
        evt_h1: 'What actually happened', no_evt: 'No events yet — summarize the chat or add one.',
        f_title: 'Title', f_where: 'Where', f_who2: 'Who was involved', f_what: 'What happened (cause & consequence)',
        kept_by: 'KEPT BY:', entries_n: '{n} entries · pick or flip ▶', no_entries: 'No entries yet. Summarize the chat or write one by hand.',
        record_n: 'RECORD {i} / {n}', weather: 'WEATHER:', mood: 'MOOD:', trust: 'TRUST', relationship: 'RELATIONSHIP',
        tab_mem: 'Memory', mem_h1: 'What the AI is told', mem_words: 'Words', mem_covered: 'Messages summarized', mem_behind: '{n} new, not summarized yet', mem_uptodate: 'up to date',
        mem_none: 'No memory yet. Press Summarize chat, or pull one in with Continue from…',
        mem_tolib: '💾 To library', mem_tolib_ok: 'Saved to the library — you can now merge it or pull it into another chat.',
        mem_edit: '✎ Edit memory', mem_edit_hint: 'This exact text is what the AI receives. Fix or add anything you like.', mem_saved: 'Memory saved.',
        mem_shrunk: 'The memory shrank a lot ({was} → {now} words) — the AI may have dropped facts. Check the Memory tab; you can restore the previous version.',
        mem_lock: 'Lock text', mem_locked: 'Locked', mem_lock_hint: 'Freeze the memory TEXT. Summarizing still updates events, NPCs, gifts and relationships — it just stops rewriting this text.',
        mem_lock_on: 'Memory text locked — it will not be rewritten.', mem_lock_off: 'Memory text unlocked — summarizing may rewrite it again.',
        mem_locked_kept: 'Memory is locked, so the text was left alone. The AI\'s proposed update is saved as a draft, and the dossier was updated as usual.',
        mem_draft: 'Proposed update (memory is locked)', mem_draft_apply: 'Replace with it', mem_draft_append: 'Add below', mem_draft_drop: 'Discard',
        set_locknew: 'New chats start with the memory text locked',
        mem_versions: 'Version history', mem_versions_hint: 'Every summarize snapshots the previous text. Restore it if something was lost.',
        mem_restore: 'Restore this version', mem_restore_confirm: 'Restore this older memory text? The current one is saved to history first, so nothing is lost.',
        mem_restored: 'Older memory restored.', mem_words_short: 'words',
        mem_lib: 'Saved memories', mem_lib_h: 'Library', mem_lib_hint: 'Every summarize is archived here. Rename, delete, merge or pull one into this chat.',
        resum_confirm: 'Full re-summarize: re-read the whole chat and rebuild the memory. Your carried-in memory is merged in, not deleted — but hand-edits to the memory text may be rewritten. Continue?',
        tab_bond: 'Bonds', bond_h1: 'Who feels what', no_bond: 'No relationships tracked yet — summarize the chat first.', bond_peak: 'Peak', bond_label: '{name} → YOU', drift: 'RELATIONSHIP DRIFT', drift_warn: 'Cooled sharply: peaked at {peak}%, now {now}%. If the AI regressed the character, press ⟲ or pin the key facts.',
        inj_anchor_head: 'Established relationship levels (do NOT regress these):', inj_anchor_note: 'These bonds are already earned. Keep the warmth/trust at least at this level unless something in the current scene changes it.',
        stamp_rag: 'ENTRY GATHERED BY RAG', stamp_manual: 'HANDWRITTEN ENTRY', stamp_link: 'LINKED TO ENTRIES & RELATIONSHIPS',
        dossier: 'Dossier', known_faces: 'Familiar Faces', occupation: 'OCCUPATION', appearance: 'APPEARANCE', how_met: 'HOW YOU MET', note: 'NOTE',
        travel_log: 'Travel Log', locations: 'Locations', loc_locked: 'Keep playing to learn more about this place…',
        gifts_h1: 'What changed hands', gifts_h2: 'Gifts', circumstances: 'Circumstances', gift_link: 'LINKED TO ENTRIES & RELATIONSHIPS',
        world_terms: 'World Terms', glossary: 'Glossary', gloss_hint: 'Definitions of names, items and places collect here — so a new chat keeps the context straight.',
        no_npc: 'No NPCs yet.', no_loc: 'No locations yet.', no_gift: 'No gifts recorded.', no_gloss: 'No glossary terms yet.',
        // actions
        act_summarize: '✦ Summarize chat', act_write: '✎ Write entry (AI)', act_add: '＋ Add', act_edit: 'Edit', act_del: 'Delete', act_save: 'Save', act_cancel: 'Cancel',
        act_inject_now: '⟳ Refresh memory', notes_tab: 'Notes', notes_ph: 'Your own notes — kept per chat, never shown to the AI unless you enable it in settings.',
        confirm_del: 'Delete this?',
        scene_tag: 'Recalled scene', set_scene_h: 'Recall raw scenes from the chat',
        set_scenesearch: 'Search the chat itself, not just the diary (recall the actual scene)',
        set_scenemax: 'Max recalled scenes per message:', set_sceneskip: "Ignore the last N messages (they're already in context):",
        chk_btn: '⚠ Check', chk_title: 'Continuity conflicts', chk_hint: 'The recent scene appears to contradict these established facts. Fix the scene, or update the diary if the story really changed.',
        chk_clean: 'No contradictions found — the scene matches the diary.', chk_found: 'Found {n} possible contradiction(s).', chk_nofacts: 'Nothing to check against yet — summarize first.',
        search_ph: 'Search entries, events, people…', pin: 'Pin', pinned: 'Pinned', pin_hint: 'Pinned facts are ALWAYS sent to the AI, no matter what the scene is about.',
        pin_on: 'Pinned — the AI will always remember this.', pin_off: 'Unpinned — back to normal retrieval.',
        cont_btn: '⇥ Continue from…', cont_title: 'Continue from another chat', cont_hint: "Pull a saved memory into THIS chat only. Your other chats and their diaries stay untouched.",
        cont_unsummarized: 'diary only (never summarized)', cont_diary_only: '{e} entries · {v} events · {n} NPCs — pull the diary, notes and dossier across',
        cont_stats: '({e} events · {n} NPCs · {g} gifts)', cont_do: '⇥ Use this memory here', cont_pick: 'Pick a memory first.', cont_done: 'Memory attached to this chat.', same_char: 'same character',
        set_carrymode: 'Auto-carry memory into new chats:', carry_char: 'Only chats with the SAME character', carry_all: 'Any new chat', carry_off: 'Never (manual only)',
        merge_btn: '⚯ Merge', merge_title: 'Merge memories', merge_hint: 'Pick two or more summaries to fuse into one unified memory (they can be from different chats).',
        merge_paste: 'Or paste another summary to include:', merge_do: '⚯ Merge selected', merge_label: 'Merged', no_library: 'No saved summaries yet — run Summarize first.',
        t_merge_need2: 'Pick at least two summaries to merge.', f_portrait: 'Portrait image URL', pick_file: '📁 File',
        f_author: "Diary author / focus character", export_btn: 'Export this chat', import_btn: 'Import into this chat',
        exportall_btn: 'Export ALL chats', importall_btn: 'Import ALL chats',
        t_importall_confirm: 'Import {n} chat diaries? Existing chats with the same id will be overwritten; the rest are kept.', t_importall_done: 'Imported {n} chat diaries.',
        lib_rename: 'Rename memory', lib_del: 'Delete memory', lib_del_confirm: 'Delete the saved memory "{name}"? This cannot be undone. (Your chat diaries are not affected.)', lib_deleted: 'Memory deleted.',
        merge_dest: 'The merged memory becomes the memory of THIS chat ({chat}) and is saved to the library.',
        t_import_bad: "That file isn't a valid diary export.", t_import_confirm: "Replace THIS chat's diary with the imported one? (Your other chats are untouched.)", t_import_done: 'Diary imported.',
        // fields
        f_date: 'Date', f_weather: 'Weather', f_loc: 'Location', f_mood: 'Mood', f_tags: 'Tags (comma-separated)', f_text: 'Text',
        f_name: 'Name', f_role: 'Role / occupation', f_look: 'Appearance', f_met: 'How you met', f_note: 'Note', f_trust: 'Relationship 0-100',
        f_desc: 'Description', f_known: 'Discovered (visible)', f_dir: 'Direction', f_item: 'Item', f_who: 'From → to', f_when: 'When', f_why: 'Why / circumstances',
        f_term: 'Term', f_def: 'Definition', dir_out: '{{user}} gives →', dir_in: '← receives',
        // toasts
        t_need_key: 'Set your OpenRouter URL / key / model in the extension settings first.',
        t_summing: 'Reading the whole chat and summarizing…', t_sum_chunk: 'Summarizing part {i}/{n}…', t_sum_done: 'Memory updated from {n} messages.',
        t_sum_empty: 'Nothing to summarize — the chat is empty.', t_sum_err: 'Summarize failed — check URL / key / model.',
        t_sum_nonew: 'No new messages since the last summary.', t_sum_nomem: 'The dossier updated, but the AI returned no memory text. Press Summarize again, or use a stronger model — small models often skip long fields.', t_sum_inc: 'Summarizing {n} new messages…',
        inj_dossier_head: 'Established facts (events, people, gifts, places):',
        set_memory_h: 'Memory carried into other chats', set_carry: 'Carry this memory into NEW chats (so a fresh chat remembers)',
        set_carrydossier: 'Also carry events / NPCs / gifts / places',
        set_carryentries: 'Also carry the diary entries themselves',
        set_carryscenes: 'Also carry a verbatim scene archive', set_carryscenes_note: 'Lets a new chat quote the original scenes word-for-word, not just the summary. Uses more space.', set_ragdossiers: 'Include NPC / gift / place dossiers in RAG retrieval',
        set_incremental: 'Summarize only NEW messages since last time (much faster)', set_autosum: 'Auto-summarize on a new in-game day',
        act_resum: '⟲ Full re-summarize',
        t_writing: 'The character is writing an entry…', t_write_done: 'New diary entry added.', t_write_err: 'Could not write the entry — check URL / key / model.',
        t_merged: 'Merged into existing memory.', t_injected: 'Hidden memory refreshed for this chat.',
        day_word: 'Day',
        // injection wrappers
        inj_wrap: 'LONG-TERM MEMORY', inj_memory_head: 'Carry-over summary (previous history):', inj_diary_head: 'Relevant memories (dated — note WHEN each happened):',
        inj_now: 'Now', days_ago: 'days earlier',
        inj_hint: 'This is established history. Treat these relationships and events as already true; do not reset characters to a colder/earlier state.',
        // settings
        set_title: 'RPG Diary & Memory', set_enable: 'Enable Diary', set_lang: 'Language:',
        set_api: 'AI (OpenRouter) — used for summaries & entries', set_url: 'API URL', set_key: 'API key', set_model: 'Model', set_temp: 'Temperature',
        set_maxtok: "Max REPLY tokens", set_maxtok_note: "This limits what the AI WRITES (the memory + dossier it returns) — not the size of your chat. Your chat is read in parts, so a 300k-token chat is fine. Lower this only if your model rejects the request.",
        t_sum_many: 'This chat is long: summarizing it will make about {n} AI calls (it only happens once — later summaries read just the new messages). Continue?',
        t_sum_trunc: "The AI's reply was cut off — raise 'Max reply tokens' in settings (or use a model with a bigger output limit), then summarize again.",
        set_inject_h: 'Hidden memory injection (invisible to you, seen by the AI)',
        set_injsummary: 'Include the summary text (uncheck to send only pins / RAG / relationships)',
        set_autoevery: 'Auto-summarize every N messages (0 = off):', set_autoevery_note: 'Works without a Scene Card. It only reads the NEW messages, so it stays cheap.',
        set_librarymode: 'Saved memories:', lib_update: 'One growing memory per chat (recommended)', lib_append: 'A new entry every time',
        set_injmemory: 'Feed memory to the AI', set_injmemory_note: 'Uncheck to keep filling the diary while injecting NOTHING into the prompt (collect-only).',
        set_injmode: 'Placement:', inj_depth: 'In recent context (at depth)', inj_top: 'As a memory header (chat start)', inj_both: 'Both',
        set_injnew: 'Inject on a new / low-context chat', set_injfull: 'Also pull diary entries when context gets full (RAG)',
        set_injdiary: 'Include diary entries in the injection', set_ragtoggle: 'Force RAG retrieval on (ignore context size)',
        set_injdepth: 'Injection depth:', set_injentries: 'Diary entries to inject:', set_injbudget: 'Max characters of diary injected:',
        set_notes_ai: 'Let the AI see my personal Notes too',
        set_auto_h: 'Automation', set_autoentry: 'Auto-write a diary entry every N game-days', set_autodays: 'Game-days between entries:',
        set_output_lang: 'AI writes in:', lang_follow: 'Same as UI', lang_en: 'English', lang_ru: 'Russian',
        set_embed_h: 'Vector RAG (optional — needs an embeddings endpoint)', set_useembed: 'Use vector embeddings for retrieval (falls back to keyword RAG)',
        set_embed_url_ph: 'blank = use the API URL above', set_embed_note: 'OpenRouter supports embeddings — leave URL/key blank to reuse the API above, and prefix the model with its provider (e.g. openai/text-embedding-3-small).',
        embed_test: 'Test embeddings', embed_ok: 'Embeddings work — {model} ({dim} dimensions).', embed_fail: 'Embeddings failed: {err}'
    },
    ru: {
        btn_open: 'Дневник', close: 'Закрыть',
        cover_title: 'Дневник', cover_sub: 'ЛИЧНЫЕ ЗАПИСИ · СОБРАНО RAG', cover_hint: 'нажми, чтобы открыть',
        tab_diary: 'Дневник', tab_evt: 'События', tab_npc: 'НПС', tab_loc: 'Локации', tab_gift: 'Дары', tab_gloss: 'Глоссарий',
        evt_h1: 'Что произошло на самом деле', no_evt: 'Событий пока нет — суммируй чат или добавь вручную.',
        f_title: 'Название', f_where: 'Где', f_who2: 'Кто участвовал', f_what: 'Что произошло (причина и последствие)',
        kept_by: 'ВЕДЁТ:', entries_n: '{n} записей · выбери или листай ▶', no_entries: 'Записей пока нет. Суммируй чат или напиши запись вручную.',
        record_n: 'ЗАПИСЬ {i} / {n}', weather: 'ПОГОДА:', mood: 'НАСТРОЕНИЕ:', trust: 'ДОВЕРИЕ', relationship: 'ОТНОШЕНИЯ',
        tab_mem: 'Память', mem_h1: 'Что получает ИИ', mem_words: 'Слов', mem_covered: 'Суммировано сообщений', mem_behind: 'новых, ещё не суммировано: {n}', mem_uptodate: 'всё актуально',
        mem_none: 'Памяти пока нет. Нажми «Суммировать чат» или подтяни через «Продолжить из…».',
        mem_tolib: '💾 В библиотеку', mem_tolib_ok: 'Сохранено в библиотеку — теперь можно объединять и переносить в другие чаты.',
        mem_edit: '✎ Править память', mem_edit_hint: 'Именно этот текст получает ИИ. Правь и дописывай что угодно.', mem_saved: 'Память сохранена.',
        mem_shrunk: 'Память сильно сократилась ({was} → {now} слов) — ИИ мог потерять факты. Загляни во вкладку «Память», можно откатить прошлую версию.',
        mem_lock: 'Заморозить', mem_locked: 'Заморожено', mem_lock_hint: 'Заморозить ТЕКСТ памяти. Суммирование продолжит обновлять события, НПС, дары и отношения — просто перестанет переписывать этот текст.',
        mem_lock_on: 'Текст памяти заморожен — переписываться не будет.', mem_lock_off: 'Текст памяти разморожен — суммирование снова может его переписать.',
        mem_locked_kept: 'Память заморожена, текст не тронут. Предложение ИИ сохранено черновиком, досье обновилось как обычно.',
        mem_draft: 'Предложение ИИ (память заморожена)', mem_draft_apply: 'Заменить им', mem_draft_append: 'Дописать снизу', mem_draft_drop: 'Отклонить',
        set_locknew: 'Новые чаты начинают с замороженным текстом памяти',
        mem_versions: 'История версий', mem_versions_hint: 'Каждое суммирование сохраняет прошлый текст. Откатись, если что-то потерялось.',
        mem_restore: 'Откатить к этой версии', mem_restore_confirm: 'Откатиться к этой версии памяти? Текущая сначала уйдёт в историю, так что ничего не пропадёт.',
        mem_restored: 'Прошлая версия восстановлена.', mem_words_short: 'слов',
        mem_lib: 'Сохранённые памяти', mem_lib_h: 'Библиотека', mem_lib_hint: 'Сюда попадает каждое суммирование. Переименуй, удали, объедини или подтяни в этот чат.',
        resum_confirm: 'Полное пересуммирование: перечитает весь чат и пересоберёт память. Перенесённая память вольётся в неё, а не удалится — но твои ручные правки текста могут быть переписаны. Продолжить?',
        tab_bond: 'Отношения', bond_h1: 'Кто как относится', no_bond: 'Отношения пока не отслеживаются — сначала суммируй чат.', bond_peak: 'Пик', bond_label: '{name} → К ТЕБЕ', drift: 'ДРЕЙФ ОТНОШЕНИЙ', drift_warn: 'Резко охладели: пик {peak}%, сейчас {now}%. Если ИИ откатил персонажа — нажми ⟲ или закрепи ключевые факты.',
        inj_anchor_head: 'Установленный уровень отношений (НЕ откатывать):', inj_anchor_note: 'Эта близость уже заслужена. Держи тепло/доверие не ниже этого уровня, если только сцена прямо этого не меняет.',
        stamp_rag: 'ЗАПИСЬ СОБРАНА RAG', stamp_manual: 'РУЧНАЯ ЗАПИСЬ', stamp_link: 'СВЯЗАНО С ЗАПИСЯМИ И ОТНОШЕНИЯМИ',
        dossier: 'Досье', known_faces: 'Знакомые лица', occupation: 'РОД ЗАНЯТИЙ', appearance: 'ВНЕШНОСТЬ', how_met: 'КАК ВСТРЕТИЛИСЬ', note: 'ЗАМЕТКА',
        travel_log: 'Путевой журнал', locations: 'Локации', loc_locked: 'Продолжай играть, чтобы узнать больше об этой локации…',
        gifts_h1: 'Что переходило из рук в руки', gifts_h2: 'Дары', circumstances: 'Обстоятельства', gift_link: 'СВЯЗАНО С ЗАПИСЯМИ И ОТНОШЕНИЯМИ',
        world_terms: 'Термины мира', glossary: 'Глоссарий', gloss_hint: 'Здесь копятся определения имён, предметов и мест — чтобы новый чат понимал контекст без ошибок.',
        no_npc: 'НПС пока нет.', no_loc: 'Локаций пока нет.', no_gift: 'Даров пока нет.', no_gloss: 'Терминов пока нет.',
        act_summarize: '✦ Суммировать чат', act_write: '✎ Написать запись (ИИ)', act_add: '＋ Добавить', act_edit: 'Изменить', act_del: 'Удалить', act_save: 'Сохранить', act_cancel: 'Отмена',
        act_inject_now: '⟳ Обновить память', notes_tab: 'Заметки', notes_ph: 'Твои заметки — хранятся в этом чате, ИИ их не видит (пока не включишь в настройках).',
        confirm_del: 'Удалить это?',
        scene_tag: 'Вспомнившаяся сцена', set_scene_h: 'Вспоминать сами сцены из чата',
        set_scenesearch: 'Искать по самому чату, а не только по дневнику (дословные сцены)',
        set_scenemax: 'Макс. сцен на сообщение:', set_sceneskip: 'Игнорировать последние N сообщений (они и так в контексте):',
        chk_btn: '⚠ Проверка', chk_title: 'Нарушения логики', chk_hint: 'Недавняя сцена, похоже, противоречит этим установленным фактам. Поправь сцену — или обнови дневник, если сюжет правда изменился.',
        chk_clean: 'Противоречий не найдено — сцена согласуется с дневником.', chk_found: 'Найдено возможных противоречий: {n}.', chk_nofacts: 'Пока не с чем сверять — сначала суммируй.',
        search_ph: 'Поиск по записям, событиям, людям…', pin: 'Закрепить', pinned: 'Закреплено', pin_hint: 'Закреплённые факты ВСЕГДА уходят ИИ, о чём бы ни была сцена.',
        pin_on: 'Закреплено — ИИ будет помнить это всегда.', pin_off: 'Откреплено — обычный подбор.',
        cont_btn: '⇥ Продолжить из…', cont_title: 'Продолжить из другого чата', cont_hint: 'Подтянуть сохранённую память ТОЛЬКО в этот чат. Другие чаты и их дневники не тронутся.',
        cont_unsummarized: 'только дневник (не суммировался)', cont_diary_only: 'записей: {e} · событий: {v} · НПС: {n} — перенести дневник, заметки и досье',
        cont_stats: '(событий: {e} · НПС: {n} · даров: {g})', cont_do: '⇥ Использовать здесь', cont_pick: 'Сначала выбери память.', cont_done: 'Память привязана к этому чату.', same_char: 'тот же персонаж',
        set_carrymode: 'Авто-перенос памяти в новые чаты:', carry_char: 'Только чаты с ТЕМ ЖЕ персонажем', carry_all: 'В любой новый чат', carry_off: 'Никогда (только вручную)',
        merge_btn: '⚯ Объединить', merge_title: 'Объединить память', merge_hint: 'Выбери два и более саммари, чтобы слить их в одну цельную память (можно из разных чатов).',
        merge_paste: 'Или вставь ещё одно саммари для объединения:', merge_do: '⚯ Объединить выбранное', merge_label: 'Объединено', no_library: 'Сохранённых саммари пока нет — сначала суммируй.',
        t_merge_need2: 'Выбери хотя бы два саммари для объединения.', f_portrait: 'URL картинки-портрета', pick_file: '📁 Файл',
        f_author: 'Автор дневника / фокус-персонаж', export_btn: 'Экспорт этого чата', import_btn: 'Импорт в этот чат',
        exportall_btn: 'Экспорт ВСЕХ чатов', importall_btn: 'Импорт ВСЕХ чатов',
        t_importall_confirm: 'Импортировать дневники {n} чатов? Чаты с теми же id перезапишутся, остальные сохранятся.', t_importall_done: 'Импортировано дневников: {n}.',
        lib_rename: 'Переименовать память', lib_del: 'Удалить память', lib_del_confirm: 'Удалить сохранённую память «{name}»? Это необратимо. (Дневники чатов не пострадают.)', lib_deleted: 'Память удалена.',
        merge_dest: 'Объединённая память станет памятью ЭТОГО чата ({chat}) и сохранится в библиотеку.',
        t_import_bad: 'Это не похоже на файл дневника.', t_import_confirm: 'Заменить дневник ЭТОГО чата импортированным? (Другие чаты не тронутся.)', t_import_done: 'Дневник импортирован.',
        f_date: 'Дата', f_weather: 'Погода', f_loc: 'Локация', f_mood: 'Настроение', f_tags: 'Теги (через запятую)', f_text: 'Текст',
        f_name: 'Имя', f_role: 'Роль / род занятий', f_look: 'Внешность', f_met: 'Как встретились', f_note: 'Заметка', f_trust: 'Отношения 0-100',
        f_desc: 'Описание', f_known: 'Открыта (видна)', f_dir: 'Направление', f_item: 'Предмет', f_who: 'От → кому', f_when: 'Когда', f_why: 'Почему / обстоятельства',
        f_term: 'Термин', f_def: 'Определение', dir_out: '{{user}} дарит →', dir_in: '← получает',
        t_need_key: 'Сначала укажи URL / ключ / модель OpenRouter в настройках расширения.',
        t_summing: 'Читаю весь чат и суммирую…', t_sum_chunk: 'Суммирую часть {i}/{n}…', t_sum_done: 'Память обновлена по {n} сообщениям.',
        t_sum_empty: 'Нечего суммировать — чат пуст.', t_sum_err: 'Не удалось суммировать — проверь URL / ключ / модель.',
        t_sum_nonew: 'Новых сообщений с прошлого суммирования нет.', t_sum_nomem: 'Досье обновилось, но ИИ не вернул текст памяти. Нажми «Суммировать» ещё раз или возьми модель посильнее — слабые модели часто пропускают длинные поля.', t_sum_inc: 'Суммирую {n} новых сообщений…',
        inj_dossier_head: 'Установленные факты (события, люди, дары, места):',
        set_memory_h: 'Память, переносимая в другие чаты', set_carry: 'Переносить эту память в НОВЫЕ чаты (чтобы новый чат помнил)',
        set_carrydossier: 'Переносить также события / НПС / дары / места',
        set_carryentries: 'Переносить также сами записи дневника',
        set_carryscenes: 'Переносить также архив дословных сцен', set_carryscenes_note: 'Новый чат сможет вспоминать оригинальные сцены дословно, а не только пересказ. Занимает больше места.', set_ragdossiers: 'Включать досье НПС / даров / мест в RAG-подбор',
        set_incremental: 'Суммировать только НОВЫЕ сообщения с прошлого раза (намного быстрее)', set_autosum: 'Авто-суммирование при наступлении нового игрового дня',
        act_resum: '⟲ Полное пересуммирование',
        t_writing: 'Персонаж пишет запись…', t_write_done: 'Новая запись добавлена в дневник.', t_write_err: 'Не удалось написать запись — проверь URL / ключ / модель.',
        t_merged: 'Объединено с прежней памятью.', t_injected: 'Скрытая память обновлена для этого чата.',
        day_word: 'День',
        inj_wrap: 'ДОЛГОСРОЧНАЯ ПАМЯТЬ', inj_memory_head: 'Перенесённое резюме (прошлая история):', inj_diary_head: 'Связанные воспоминания (с датами — учитывай, КОГДА это было):',
        inj_now: 'Сейчас', days_ago: 'дн. назад',
        inj_hint: 'Это уже установленная история. Считай эти отношения и события уже истинными; не откатывай персонажей к более холодному/раннему состоянию.',
        set_title: 'RPG Дневник и Память', set_enable: 'Включить дневник', set_lang: 'Язык:',
        set_api: 'ИИ (OpenRouter) — для резюме и записей', set_url: 'API URL', set_key: 'API-ключ', set_model: 'Модель', set_temp: 'Температура',
        set_maxtok: 'Макс. токенов ОТВЕТА', set_maxtok_note: 'Ограничивает то, что ИИ ПИШЕТ (память и досье в ответе) — а не размер твоего чата. Чат читается по частям, так что даже 300k токенов не проблема. Снижай, только если модель отказывается принимать запрос.',
        t_sum_many: 'Чат длинный: суммирование сделает примерно {n} запросов к ИИ (это разово — дальше читаются только новые сообщения). Продолжить?',
        t_sum_trunc: 'Ответ ИИ оборвался — подними «Макс. токенов ответа» в настройках (или возьми модель с большим лимитом вывода) и суммируй заново.',
        set_inject_h: 'Скрытая инъекция памяти (тебе не видна, ИИ видит)',
        set_injsummary: 'Вставлять текст суммирования (сними — уйдут только 📌, RAG и отношения)',
        set_autoevery: 'Авто-суммирование каждые N сообщений (0 = выкл):', set_autoevery_note: 'Работает без Scene Card. Читает только НОВЫЕ сообщения, поэтому дёшево.',
        set_librarymode: 'Сохранённые памяти:', lib_update: 'Одна растущая память на чат (рекомендуется)', lib_append: 'Новая запись каждый раз',
        set_injmemory: 'Передавать память ИИ', set_injmemory_note: 'Сними галку, чтобы дневник продолжал заполняться, но НИЧЕГО не вставлялось в промпт (только копить).',
        set_injmode: 'Куда вставлять:', inj_depth: 'В недавний контекст (на глубину)', inj_top: 'Заголовком памяти (начало чата)', inj_both: 'И то, и то',
        set_injnew: 'Вставлять в новом / пустом чате', set_injfull: 'Подтягивать записи дневника при заполнении контекста (RAG)',
        set_injdiary: 'Включать записи дневника в инъекцию', set_ragtoggle: 'Всегда включать RAG-подбор (игнорировать размер контекста)',
        set_injdepth: 'Глубина инъекции:', set_injentries: 'Сколько записей вставлять:', set_injbudget: 'Макс. символов дневника в инъекции:',
        set_notes_ai: 'Показывать ИИ и мои личные Заметки',
        set_auto_h: 'Автоматизация', set_autoentry: 'Авто-запись в дневник каждые N игровых дней', set_autodays: 'Игровых дней между записями:',
        set_output_lang: 'ИИ пишет на:', lang_follow: 'Как интерфейс', lang_en: 'Английском', lang_ru: 'Русском',
        set_embed_h: 'Векторный RAG (опционально — нужен эмбеддинг-эндпоинт)', set_useembed: 'Использовать векторные эмбеддинги для поиска (иначе — поиск по словам)',
        set_embed_url_ph: 'пусто = взять URL API выше', set_embed_note: 'OpenRouter поддерживает эмбеддинги — оставь URL/ключ пустыми, чтобы взять API выше, и указывай модель с префиксом провайдера (например openai/text-embedding-3-small).',
        embed_test: 'Проверить эмбеддинги', embed_ok: 'Эмбеддинги работают — {model} ({dim} измерений).', embed_fail: 'Эмбеддинги не работают: {err}'
    }
};
function t(key, vars) {
    const lang = settings.language === 'ru' ? 'ru' : 'en';
    let str = (I18N[lang] && I18N[lang][key] !== undefined) ? I18N[lang][key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
    if (vars) for (const k in vars) str = str.split('{' + k + '}').join(vars[k]);
    return str;
}
function outLang() {
    if (settings.outputLang === 'en') return 'English';
    if (settings.outputLang === 'ru') return 'Russian';
    return settings.language === 'ru' ? 'Russian' : 'English';
}

/* ============================================================ SETTINGS + STATE */
const defaultSettings = {
    enabled: false,
    language: 'en',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'google/gemma-4-31b-it',
    temperature: 0.7,
    maxTokens: 16000,
    outputLang: 'follow',
    injectMemory: true,
    injectSummary: true,        // the summary text block specifically (separate from RAG/diary)
    lockNewMemory: false,      // new chats start with the memory text locked
    libraryMode: 'update',      // 'update' = one living memory per chat · 'append' = a new one each time
    autoEvery: 0,               // auto-summarize every N messages (0 = off; works without a Scene Card)         // master switch: off = collect only, never touch the prompt
    injectMode: 'depth',        // 'depth' | 'top' | 'both'
    injectOnNew: true,
    injectDiary: true,
    injectWhenFull: true,
    ragToggle: false,
    injectDepth: 4,
    injectEntries: 3,
    injectBudget: 1400,
    notesToAI: false,
    autoEntry: false,
    autoSummarize: false,
    autoEntryDays: 1,
    incremental: true,
    carryOver: true,
    carryMode: 'off',
    carryDossier: true,
    carryEntries: true,
    carryScenes: false,
    carrySceneMax: 40,
    ragDossiers: true,
    carry: { summary: '', dossier: '', ts: 0, from: '' },
    sceneSearch: true,
    sceneSkipTail: 30,
    sceneMax: 2,
    useEmbeddings: false,
    embedUrl: '',
    embedKey: '',
    embedModel: 'openai/text-embedding-3-small',
    summaryLibrary: [],
    chatStates: {}
};
let settings = {};

function loadSettings() {
    if (!extension_settings[MODULE_NAME]) extension_settings[MODULE_NAME] = {};
    settings = Object.assign({}, defaultSettings, extension_settings[MODULE_NAME]);
    if (!settings.chatStates) settings.chatStates = {};
}
function saveSettings(immediate = true) {
    extension_settings[MODULE_NAME] = settings;
    if (immediate && typeof stSaveSettings === 'function') {
        try { const p = stSaveSettings(); if (p && typeof p.catch === 'function') p.catch(() => { }); return; }
        catch (e) { /* fall through */ }
    }
    if (typeof saveSettingsDebounced === 'function') saveSettingsDebounced();
}

let state = null;
function freshState() {
    return { author: '', entries: [], events: [], npcs: [], locations: [], gifts: [], glossary: [], notes: '', summary: '', memoryLocked: false, pendingMemory: '', carriedDossier: '', archiveScenes: [], bond: null, summaries: [], summarizedCount: 0, lastSummaryDay: null, meta: { created: Date.now() } };
}
function loadState() {
    const chatId = chatKey();
    if (!chatId) { state = freshState(); return; }
    if (settings.chatStates[chatId]) {
        state = settings.chatStates[chatId];
        const f = freshState();
        for (const k in f) if (!(k in state)) state[k] = f[k];
        for (const arr of ['entries', 'events', 'npcs', 'locations', 'gifts', 'glossary', 'summaries', 'archiveScenes']) if (!Array.isArray(state[arr])) state[arr] = [];
    } else {
        state = freshState();
        if (settings.lockNewMemory) state.memoryLocked = true;
        settings.chatStates[chatId] = state;
    }
}
function saveState(immediate = true) {
    const chatId = chatKey();
    if (chatId) settings.chatStates[chatId] = state;
    saveSettings(immediate);
    scheduleEmbed();
}

/* ============================================================ HELPERS */
function genId() { return Math.random().toString(36).slice(2, 9); }
function chatKey() { const c = getContext(); return c.chatId || (c.groupId ? 'group_' + c.groupId : (c.selected_group ? 'group_' + c.selected_group : null)); }
function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function clamp(n, lo, hi) { n = parseInt(n); if (!isFinite(n)) n = lo; return Math.max(lo, Math.min(hi, n)); }
function locIconFor(name, given) {
    if (given && G[given]) return given;
    const s = String(name || '').toLowerCase();
    if (/tavern|bar|pub|inn|таверн|бар|паб/.test(s)) return 'tavern';
    if (/clinic|hospital|клиник|больниц|госпит/.test(s)) return 'clinic';
    if (/school|class|акадэм|школ|класс|универ/.test(s)) return 'school';
    if (/alley|переул|тупик/.test(s)) return 'alley';
    if (/roof|крыш/.test(s)) return 'roof';
    if (/home|house|apartment|дом|кварти/.test(s)) return 'home';
    return 'pin';
}

/* ============================================================ BRIDGE READS */
function readVitals() {
    try {
        const v = window.RPG && window.RPG.vitals;
        if (!v || !v.available) return null;
        if (v.isEnabled && !v.isEnabled()) return null;
        const hp = v.getHp ? v.getHp() : null;
        return {
            hp: hp ? hp.hp : null, hpMax: hp ? hp.max : null,
            mana: v.getMana ? v.getMana() : null, fatigue: v.getFatigue ? v.getFatigue() : null,
            level: v.getLevel ? v.getLevel() : null, buffs: (v.listBuffs ? v.listBuffs() : []) || []
        };
    } catch (e) { return null; }
}
function sceneDayNumber(dateStr) {
    if (!dateStr) return null;
    const m = String(dateStr).match(/(\d{1,4})/);
    return m ? parseInt(m[1]) : null;
}
function readScene() {
    // 1) preferred: the RPG Scene Card bridge (window.RPG.scene.get())
    try {
        const s = window.RPG && window.RPG.scene;
        if (s) {
            let d = null;
            for (const m of ['get', 'state', 'now', 'getTime', 'current']) { if (typeof s[m] === 'function') { d = s[m](); break; } }
            if (d && typeof d === 'object') {
                return {
                    label: d.timeLabel || d.label || [d.date, d.time].filter(Boolean).join(' · ') || d.time || null,
                    day: (typeof d.day === 'number') ? d.day : sceneDayNumber(d.date),
                    weather: d.weather || null, season: d.season || null,
                    loc: d.location || d.loc || d.place || null
                };
            }
        }
    } catch (e) { /* ignore */ }
    // 2) fallback: read the Scene Card's per-message data directly (works even if it has no bridge)
    try {
        const chat = getContext().chat || [];
        for (let i = chat.length - 1; i >= 0; i--) {
            const d = chat[i] && chat[i].extra && chat[i].extra.rpg_info_box;
            if (d && typeof d === 'object') {
                const label = [d.date, d.time].filter(Boolean).join(' · ') || d.date || d.time || null;
                if (!label && !d.location) continue;
                return { label, day: sceneDayNumber(d.date), weather: d.weather || null, season: null, loc: d.location || null };
            }
        }
    } catch (e) { /* ignore */ }
    return null;
}
function currentStamp() {
    const sc = readScene();
    if (sc && (sc.label || sc.day != null || sc.loc)) {
        const label = sc.label || (sc.day != null ? `${t('day_word')} ${sc.day}` : nowLabel());
        return { label, day: sc.day, weather: sc.weather || '', loc: sc.loc || '', locIcon: locIconFor(sc.loc), source: 'scene' };
    }
    return { label: nowLabel(), day: null, weather: '', loc: '', locIcon: 'pin', source: 'system' };
}
function nowLabel() {
    const now = new Date();
    const loc = settings.language === 'ru' ? 'ru-RU' : 'en-US';
    return now.toLocaleDateString(loc, { day: 'numeric', month: 'long' }) + ' · ' + now.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
}

/* ============================================================ AI */
async function callAI(systemPrompt, userPrompt, maxTokens) {
    if (!settings.apiKey) throw new Error('no-key');
    const url = (settings.baseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions';
    for (let i = 0; i < 2; i++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${settings.apiKey.trim()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: settings.model,
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                    temperature: typeof settings.temperature === 'number' ? settings.temperature : 0.7,
                    max_tokens: maxTokens || (parseInt(settings.maxTokens) || 16000)
                })
            });
            if (res.status === 429 && i === 0) { await new Promise(r => setTimeout(r, 2000)); continue; }
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
        } catch (e) { if (i === 1) throw e; }
    }
    return '';
}
// Models don't always honour the schema: "memory" can arrive as a string, an array of paragraphs,
// or an object. Previously anything but a string was silently dropped — the dossier updated and the
// memory stayed empty. Coerce whatever we get into text.
function coerceText(v) {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (Array.isArray(v)) return v.map(coerceText).filter(Boolean).join('\n\n');
    if (typeof v === 'object') {
        if (typeof v.text === 'string') return v.text.trim();
        if (typeof v.summary === 'string') return v.summary.trim();
        return Object.values(v).map(coerceText).filter(Boolean).join('\n');
    }
    return String(v).trim();
}
function parseJSON(raw) {
    if (!raw) return null;
    let s = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
    try { return JSON.parse(s); } catch (e) { return null; }
}

/* ---- EMBEDDINGS (optional vector RAG) ---- */
const vecCache = new Map();   // key `${chunkId}:${hash}` -> Float array. In-memory only (not persisted).
let lastQueryVec = null, embedBusy = false, embedTimer = null, embedWorking = false;
function vecKey(c) { return 'h' + hashText(String(c.text || '') + '|' + String(c.extra || '')); }
function hashText(s) { let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return h; }
function embedConfigured() { return settings.useEmbeddings && !!(settings.embedUrl || settings.baseUrl) && !!(settings.embedKey || settings.apiKey); }
async function testEmbeddings() {
    const btn = document.getElementById('rpgd-embtest');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    try {
        const v = await embed(['test']);
        const dim = (v && v[0] && v[0].length) || 0;
        if (!dim) throw new Error('empty');
        toastr.success(t('embed_ok', { model: settings.embedModel, dim }));
    } catch (e) {
        toastr.error(t('embed_fail', { err: String(e.message || e) }), '', { timeOut: 12000 });
    }
    if (btn) { btn.disabled = false; btn.textContent = t('embed_test'); }
}
async function embed(texts) {
    const url = ((settings.embedUrl || settings.baseUrl) || '').replace(/\/$/, '') + '/embeddings';
    const key = (settings.embedKey || settings.apiKey || '').trim();
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: settings.embedModel || 'openai/text-embedding-3-small', input: texts, encoding_format: 'float' })
    });
    if (!res.ok) {
        let detail = '';
        try { const j = await res.json(); detail = (j.error && (j.error.message || j.error)) || ''; } catch (_) { }
        throw new Error('HTTP ' + res.status + (detail ? ' — ' + detail : ''));
    }
    const data = await res.json();
    return (data.data || []).map(d => d.embedding);
}
function cosine(a, b) {
    if (!a || !b || a.length !== b.length) return -1;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return (na && nb) ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : -1;
}
function scheduleEmbed() {
    if (!embedConfigured() || !state) return;
    clearTimeout(embedTimer);
    embedTimer = setTimeout(() => { refreshEmbeddings(); }, 1200);
}
async function refreshEmbeddings() {
    if (embedWorking || !embedConfigured() || !state) return;
    embedWorking = true;
    try {
        const chunks = memoryChunks();
        // 1) embed any chunk we haven't seen this exact text for (cached by content, not position,
        //    so growing the chat doesn't re-embed — and re-bill — everything)
        const need = [], needKeys = [];
        for (const c of chunks) {
            const key = vecKey(c);
            if (!vecCache.has(key)) { need.push(c.text + ' ' + (c.extra || '')); needKeys.push(key); }
        }
        const BATCH = 64;
        for (let i = 0; i < need.length; i += BATCH) {
            const vs = await embed(need.slice(i, i + BATCH));
            vs.forEach((v, j) => { const k = needKeys[i + j]; if (k && v) vecCache.set(k, v); });
        }
        // 2) embed the current query (recent messages + location)
        const q = buildTranscript().slice(-6).join(' ') + ' ' + (readScene() && readScene().loc || '');
        if (q.trim()) { const qv = await embed([q.slice(0, 4000)]); if (qv && qv[0]) lastQueryVec = qv[0]; }
        buildInjection(); // re-inject now that vectors are fresh
    } catch (e) { /* silent: BM25 remains the fallback */ }
    embedWorking = false;
}
function cosineRetrieve(chunks, topK) {
    if (!lastQueryVec) return null;
    const scored = [];
    for (const c of chunks) {
        const v = vecCache.get(vecKey(c));
        if (!v) continue;
        scored.push({ c, s: cosine(lastQueryVec, v) });
    }
    if (scored.length < Math.min(chunks.length, 2)) return null; // not enough vectors yet → let BM25 handle it
    return scored.sort((a, b) => b.s - a.s).slice(0, topK).map(x => x.c);
}

/* ============================================================ TRANSCRIPT + SUMMARIZE */
function buildTranscript() {
    const ctx = getContext();
    const chat = ctx.chat || [];
    const out = [];
    for (const m of chat) {
        if (!m || m.is_system) continue;
        if (m.extra && m.extra.rpg_diary_memory) continue;
        const who = m.is_user ? (ctx.name1 || 'User') : (m.name || ctx.name2 || 'Character');
        const txt = String(m.mes || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
        if (txt) out.push(`${who}: ${txt}`);
    }
    return out;
}
function chunkLines(lines, maxChars) {
    const chunks = []; let buf = '';
    for (const ln of lines) {
        if (buf.length + ln.length + 1 > maxChars && buf) { chunks.push(buf); buf = ''; }
        buf += (buf ? '\n' : '') + ln;
    }
    if (buf) chunks.push(buf);
    return chunks;
}
function names() {
    const ctx = getContext();
    return { user: ctx.name1 || 'User', char: (state && state.author) || ctx.name2 || 'Character' };
}
function mapPrompt() {
    const { user, char } = names();
    return `You are a FACT EXTRACTOR, not a storyteller. Read this roleplay transcript chunk and list the HARD FACTS.
Focus character: "${char}". Player character: "${user}".

CRITICAL RULES:
- Write in NEUTRAL THIRD PERSON. Never write in a character's voice. No metaphors, no literary flourishes, no "the variable proved resilient" style. Plain, concrete, boring is CORRECT.
- Record WHAT HAPPENED and WHY, not how it felt. Feelings only as a short factual note ("X now trusts Y because Z").
- Never omit a concrete event because it seems minor.

You MUST capture, if present:
1. PREMISE & SECRETS — disguises, hidden identities, lies being maintained, and who knows (e.g. "X is posing as a man to attend the university; only Y knows").
2. HARD EVENTS — every physical event with cause and consequence: confinement, being locked in/imprisoned, injuries, fainting/loss of consciousness AND ITS CAUSE, violence, traps, illness, rescues, escapes.
3. OBLIGATIONS — debts (amount, TO WHOM, HOW it was incurred, HOW it must be repaid), bargains, oaths, threats, blackmail, contracts.
4. RULES & PERMISSIONS — what a character forbade, allowed, ordered or conceded to another, and any conditions attached.
5. STATED PLANS & INTENTIONS — what a character plans to do with/to another, openly or privately.
6. RELATIONSHIPS — who feels what toward whom and the concrete reason.
7. PLACES, ITEMS, GIFTS — what changed hands, from whom to whom, and why.

Output terse factual bullets, no headings, no preamble, in ${outLang()}.`;
}
function existingDossierBlock() {
    if (!state) return '';
    const p = [];
    if (state.npcs.length) p.push('NPCs: ' + state.npcs.map(n => `${n.name} — role: ${n.role || '?'}; how_met: ${n.met || '?'}; note: ${n.note || '?'}`).join(' | '));
    if (state.events.length) p.push('EVENTS: ' + state.events.map(e => e.title).join(' | '));
    if (state.locations.length) p.push('LOCATIONS: ' + state.locations.map(l => l.name).join(', '));
    if (state.gifts.length) p.push('GIFTS: ' + state.gifts.map(g => `${g.item} (${g.who})`).join(' | '));
    if (state.glossary.length) p.push('GLOSSARY: ' + state.glossary.map(g => g.term).join(', '));
    if (!p.length) return '';
    let blk = p.join('\n');
    if (blk.length > 2500) blk = blk.slice(0, 2500) + '…';
    return `\nEXISTING DOSSIER (already recorded — do NOT duplicate these, UPDATE them):\n"""${blk}"""\nRules for these:
- If you have NEW information about someone/something already listed, return that entry again USING THE SAME EXACT NAME/TITLE, and write the COMPLETE merged version (old facts + new facts). Never return a shorter, poorer version of an existing entry — that would erase what we know.
- Only create a NEW entry for someone/something genuinely not in the list.
`;
}
function memoryPrompt(prior) {
    const nm = names();
    const priorBlock = prior
        ? '\nEXISTING MEMORY — merge the new facts into it and KEEP EVERY FACT already here. Clarify vague references (which event, where; which item, from where; which debt, on what terms). Never return a shorter, poorer version:\n"""' + prior + '"""\n'
        : '';
    return 'You write the LONG-TERM MEMORY for a roleplay, so that a BRAND-NEW chat (characters start knowing nothing) can rely on it and NOT reset the relationship to an earlier/colder state.\n'
        + 'Focus character: "' + nm.char + '". Player character: "' + nm.user + '".' + priorBlock + '\n'
        + 'ABSOLUTELY CRITICAL: do NOT write in a character\'s voice and do NOT write literary prose. "She has proven more resilient than anticipated; I am calibrating my finest tool" is a FAILURE — it keeps the mood and loses the plot. Write a NEUTRAL, THIRD-PERSON, CONCRETE dossier. If a fact and a feeling compete for space, KEEP THE FACT.\n\n'
        + 'State explicitly, where applicable:\n'
        + '- The premise and any disguise/secret (e.g. WHY she is dressed as a man; that she attends the university in disguise; who knows and who must not find out).\n'
        + '- Every hard event with cause and consequence: who was locked in where and why; who lost consciousness AND FROM WHAT; injuries; traps; violence; escapes.\n'
        + '- Every debt/obligation: amount, to whom, exactly how it was incurred, exactly how it must be worked off.\n'
        + '- Every rule, prohibition and permission a character imposed or granted, with conditions.\n'
        + '- Plans and intentions a character has FOR the other, including hidden ones.\n'
        + '- Current relationship status and the concrete reasons behind it.\n'
        + '- Intimacy/chemistry if present: who leads, preferences, tenderness vs roughness, and how it affects the bond.\n'
        + '- Small recurring details, in-jokes, promises.\n'
        + 'End with one line stating the settling-in phase is over and the characters act as an established pair, so the AI does not regress ' + nm.char + ' to cold or dismissive.\n\n'
        + 'Return ONLY the memory text (300-700 words) in ' + outLang() + '. No JSON, no headings, no preamble.';
}
function dossierPrompt() {
    const nm = names();
    return 'Extract structured records from the roleplay notes below. Focus character: "' + nm.char + '". Player: "' + nm.user + '".\n'
        + existingDossierBlock() + '\n'
        + 'Return STRICT JSON only, nothing else:\n'
        + '{\n'
        + ' "title": "<short 3-7 word label for this story, e.g. \'Rufus — Moriarty\'s operative\'>",\n'
        + ' "bond": {"trust":0-100,"status":"<one factual line: how ' + nm.char + ' currently feels about ' + nm.user + ' and where they stand>"},\n'
        + ' "events": [{"title":"","when":"","where":"","who":"","what":"<what happened, cause and consequence, factual>"}],\n'
        + ' "npcs": [{"name":"","role":"","look":"<physical appearance>","how_met":"<the STORY of the first meeting: where, when, what happened — a full sentence, never yes/no>","note":"<how they relate to ' + nm.user + ' and WHY>","trust":0-100}],\n'
        + ' "locations": [{"name":"","desc":""}],\n'
        + ' "gifts": [{"dir":"out|in","item":"","who":"<from> → <to>","when":"","why":""}],\n'
        + ' "glossary": [{"term":"","def":""}],\n'
        + ' "entry": {"text":"<short first-person diary entry by ' + nm.char + ' about this stretch>","mood":"","tags":["",""]}\n'
        + '}\n'
        + 'KEEP THE REPLY SMALL: include a record ONLY if it is NEW, or if you have NEW information about it. Do NOT re-emit unchanged records — they are already saved.\n'
        + 'BUT when you DO include a record that already exists, use the SAME EXACT NAME/TITLE and write the COMPLETE MERGED version (old facts + new facts, woven into one coherent description). Never return a shorter, poorer version of an existing record — that would erase what we know.\n'
        + '"events" must capture the concrete plot beats (confinements, faintings, debts incurred, bargains, reveals, injuries, turning points).\n'
        + '"dir":"out" means ' + nm.user + ' gave it; "in" means ' + nm.user + ' received it. All human-readable text in ' + outLang() + '.';
}

let aiBusy = false;
async function summarizeChat(force) {
    if (aiBusy) return;
    if (!settings.apiKey) { toastr.warning(t('t_need_key')); return; }
    const allLines = buildTranscript();
    if (!allLines.length) { toastr.info(t('t_sum_empty')); return; }
    const already = state.summarizedCount || 0;
    const incremental = !force && settings.incremental !== false && !!(state.summary || '').trim() && already > 0 && already < allLines.length;
    const lines = incremental ? allLines.slice(already) : allLines;
    if (incremental && !lines.length) { toastr.info(t('t_sum_nonew')); return; }
    aiBusy = true; renderPanel();
    try {
        // Read the chat in parts. Bigger parts = fewer API calls; the cap only exists to stop a runaway
        // job, and it is high enough for very long chats (300k+ tokens).
        const chunks = chunkLines(lines, 15000).slice(0, 200);
        if (chunks.length > 20 && !confirm(t('t_sum_many', { n: chunks.length }))) { aiBusy = false; renderPanel(); return; }
        let notes = '';
        if (chunks.length === 1) {
            notes = chunks[0];
        } else {
            const parts = [];
            for (let i = 0; i < chunks.length; i++) {
                toastr.info(t('t_sum_chunk', { i: i + 1, n: chunks.length }));
                const n = await callAI(mapPrompt(), chunks[i], 2500);   // notes only — no need for the full budget
                if (n) parts.push(n);
            }
            notes = parts.join('\n');
        }
        const prior = (state.summary || '').trim();
        // TWO SEPARATE CALLS. Asking one reply to carry the memory AND the whole merged dossier makes the
        // output enormous once a dossier exists — it hits the token limit, gets cut off, and the memory
        // (which the model writes after the dossier rules) is the part that goes missing. Splitting them
        // means the memory can never be starved by a big dossier.
        toastr.info(incremental ? t('t_sum_inc', { n: lines.length }) : t('t_summing'));
        const memText = (await callAI(memoryPrompt(prior), notes, 3500) || '').trim();

        const rawJson = await callAI(dossierPrompt(), notes);
        const obj = parseJSON(rawJson) || {};
        if (rawJson && !/}\s*$/.test(rawJson.trim())) toastr.warning(t('t_sum_trunc'), '', { timeOut: 14000 });
        if (memText) obj.memory = memText;

        if (!coerceText(obj.memory) && !obj.events && !obj.npcs) { toastr.error(t('t_sum_err')); aiBusy = false; renderPanel(); return; }
        applySummary(obj, prior, lines.length);
        if (!(state.summary || '').trim() && !state.memoryLocked) toastr.warning(t('t_sum_nomem'), '', { timeOut: 12000 });
        state.summarizedCount = allLines.length;
        updateCarry();
        toastr.success(prior ? t('t_merged') : t('t_sum_done', { n: lines.length }));
    } catch (e) {
        toastr.error(t('t_sum_err'));
    }
    aiBusy = false;
    saveState(); renderPanel(); buildInjection();
}
// Save (or refresh) THIS chat's memory in the library. Called at the END of a summarize, so the
// snapshot contains the events/NPCs that were just merged — and called even when the memory text is
// locked or the AI returned none, so a chat can never become invisible to Merge / Continue-from.
function saveToLibrary(autoTitleRaw) {
    if (!state) return false;
    const text = (state.summary || '').trim();
    const hasDossier = state.events.length || state.npcs.length || state.gifts.length;
    if (!text && !hasDossier) return false;                 // truly nothing to save yet
    if (!Array.isArray(settings.summaryLibrary)) settings.summaryLibrary = [];
    const key = chatKey() || '';
    const autoTitle = (autoTitleRaw && String(autoTitleRaw).trim()) || (getContext().name2 || '') || t('merge_label');
    const entry = {
        ts: Date.now(), char: getContext().name2 || '', srcChat: key,
        chat: (getContext().name2 || '') + ' · ' + new Date().toLocaleDateString(),
        text: text, dossier: dossierDigest(state), data: snapshotDossier(),
        scenes: settings.carryScenes ? buildSceneArchive() : []
    };
    const existing = (settings.libraryMode !== 'append') ? settings.summaryLibrary.find(x => x.srcChat && x.srcChat === key) : null;
    if (existing) {
        const keepTitle = existing.title;
        Object.assign(existing, entry);
        existing.title = keepTitle || String(autoTitle).slice(0, 60);   // never lose a name the user set
    } else {
        settings.summaryLibrary.unshift(Object.assign({ id: genId(), title: String(autoTitle).slice(0, 60) }, entry));
    }
    settings.summaryLibrary = settings.summaryLibrary.slice(0, 40);
    return true;
}
function applySummary(obj, hadPrior, msgN) {
    const memText = coerceText(obj.memory);
    if (memText && state.memoryLocked) {
        // Memory text is frozen by the user. Keep the AI's proposal as a draft they can look at,
        // and let every other fact (events, NPCs, gifts, bond…) keep updating as usual.
        state.pendingMemory = memText;
        toastr.info(t('mem_locked_kept'), '', { timeOut: 9000 });
    } else if (memText) {
        const prevText = (state.summary || '').trim();
        const nextText = memText;
        // Always snapshot the version we are about to replace, so nothing the model drops is gone for good.
        if (prevText) {
            state.summaries.unshift({ id: genId(), ts: Date.now(), name: getContext().name2 || '', text: prevText, words: prevText.split(/\s+/).length });
            state.summaries = state.summaries.slice(0, 20);
        }
        state.summary = nextText;
        // A large shrink means the model probably lost facts instead of merging them — say so loudly.
        const pw = prevText ? prevText.split(/\s+/).length : 0;
        const nw = nextText.split(/\s+/).length;
        if (pw > 80 && nw < pw * 0.65) toastr.warning(t('mem_shrunk', { was: pw, now: nw }), '', { timeOut: 12000 });
    }
    if (obj.bond && typeof obj.bond === 'object') {
        const v = (typeof obj.bond.trust === 'number') ? clamp(obj.bond.trust, 0, 100) : (state.bond && state.bond.trust);
        if (!state.bond) state.bond = { trust: null, status: '', history: [] };
        if (typeof v === 'number' && v !== state.bond.trust) {
            const st2 = currentStamp();
            if (!Array.isArray(state.bond.history)) state.bond.history = [];
            state.bond.history.push({ v, ts: Date.now(), day: st2.day });
            if (state.bond.history.length > 40) state.bond.history = state.bond.history.slice(-40);
            state.bond.trust = v;
        }
        if (obj.bond.status) state.bond.status = mergeText(state.bond.status, String(obj.bond.status), 300);
    }
    mergeEvents(obj.events); mergeNpcs(obj.npcs); mergeLocations(obj.locations); mergeGifts(obj.gifts); mergeGlossary(obj.glossary);
    if (obj.entry && obj.entry.text) {
        const st = currentStamp();
        state.entries.push({
            id: genId(), ts: Date.now(), date: st.label, gameDay: st.day, weather: st.weather, loc: st.loc, locIcon: st.locIcon,
            mood: String(obj.entry.mood || ''), trust: null, tags: Array.isArray(obj.entry.tags) ? obj.entry.tags.slice(0, 5).map(String) : [],
            text: String(obj.entry.text).trim(), source: 'ai'
        });
    }
    const st = currentStamp(); if (st.day != null) state.lastSummaryDay = st.day;
    saveToLibrary(obj.title);   // after the merges, so the saved snapshot is the fresh one
}
function norm(x) { return String(x || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
// Merge a field so an update can only ADD knowledge, never silently destroy it:
// - no old value -> take the new one
// - new already contains the old (a proper rewrite) -> take the new one
// - old already contains the new (nothing fresh) -> keep the old one
// - genuinely different -> keep both (old first, new appended)
function mergeText(oldV, newV, cap) {
    const o = String(oldV || '').trim(), n = String(newV || '').trim();
    if (!n) return o;
    if (!o) return n;
    const no = norm(o), nn = norm(n);
    if (nn.includes(no)) return n;
    if (no.includes(nn)) return o;
    let out = o.replace(/[.;\s]+$/, '') + '. ' + n;
    const lim = cap || 700;
    if (out.length > lim) out = out.slice(0, lim) + '…';
    return out;
}
function mergeEvents(arr) {
    if (!Array.isArray(arr)) return;
    for (const e of arr) {
        if (!e || (!e.title && !e.what)) continue;
        const title = String(e.title || (e.what || '').slice(0, 40));
        const dup = state.events.find(x => norm(x.title) === norm(title));
        if (dup) {
            dup.what = mergeText(dup.what, e.what, 900);
            if (!dup.when && e.when) dup.when = String(e.when);
            if (!dup.where && e.where) dup.where = String(e.where);
            if (!dup.who && e.who) dup.who = String(e.who);
            continue;
        }
        const stx = currentStamp();
        state.events.push({ id: genId(), ts: Date.now(), title, when: String(e.when || stx.label || ''), day: stx.day, where: String(e.where || ''), who: String(e.who || ''), what: String(e.what || '') });
    }
}
function mergeNpcs(arr) {
    if (!Array.isArray(arr)) return;
    for (const n of arr) {
        if (!n || !n.name) continue;
        let ex = state.npcs.find(x => x.name.toLowerCase() === String(n.name).toLowerCase());
        if (!ex) { ex = { id: genId(), name: String(n.name), icon: 'user' }; state.npcs.push(ex); }
        if (n.role) ex.role = String(n.role);
        ex.look = mergeText(ex.look, n.look, 400);
        const met = n.how_met != null ? n.how_met : n.met;   // schema uses how_met; keep old key working
        const metStr = (met == null || typeof met === 'boolean') ? '' : String(met).trim();
        // guard: models used to answer the ambiguous "met" key with a bare "Yes"/"Да" — that's not a story
        if (metStr && !/^(yes|no|true|false|да|нет|y|n)[.!]?$/i.test(metStr)) ex.met = mergeText(ex.met, metStr, 400);
        ex.note = mergeText(ex.note, n.note, 800);
        if (typeof n.trust === 'number') {
            const v = clamp(n.trust, 0, 100);
            if (!Array.isArray(ex.trustHistory)) ex.trustHistory = (typeof ex.trust === 'number') ? [{ v: ex.trust, ts: 0, day: null }] : [];
            if (ex.trust !== v) {
                const st = currentStamp();
                ex.trustHistory.push({ v, ts: Date.now(), day: st.day });
                if (ex.trustHistory.length > 40) ex.trustHistory = ex.trustHistory.slice(-40);
            }
            ex.trust = v;
        }
    }
}
function mergeLocations(arr) {
    if (!Array.isArray(arr)) return;
    for (const l of arr) {
        if (!l || !l.name) continue;
        let ex = state.locations.find(x => x.name.toLowerCase() === String(l.name).toLowerCase());
        if (!ex) { ex = { id: genId(), name: String(l.name), known: true }; state.locations.push(ex); }
        ex.desc = mergeText(ex.desc, l.desc, 600);
        ex.icon = locIconFor(l.name, l.icon);
        ex.known = true;
    }
}
function mergeGifts(arr) {
    if (!Array.isArray(arr)) return;
    for (const g of arr) {
        if (!g || !g.item) continue;
        const dir = g.dir === 'in' ? '←' : '→';
        const dup = state.gifts.find(x => norm(x.item) === norm(g.item) && norm(x.who) === norm(g.who || ''));
        if (dup) { dup.why = mergeText(dup.why, g.why, 400); if (!dup.when && g.when) dup.when = String(g.when); continue; }
        state.gifts.push({ id: genId(), dir, item: String(g.item), who: String(g.who || ''), when: String(g.when || ''), why: String(g.why || '') });
    }
}
function mergeGlossary(arr) {
    if (!Array.isArray(arr)) return;
    for (const t2 of arr) {
        if (!t2 || !t2.term) continue;
        let ex = state.glossary.find(x => x.term.toLowerCase() === String(t2.term).toLowerCase());
        if (!ex) { ex = { id: genId(), term: String(t2.term) }; state.glossary.push(ex); }
        ex.def = mergeText(ex.def, t2.def, 500);
    }
}
async function mergeSummaries(texts) {
    if (aiBusy) return;
    if (!settings.apiKey) { toastr.warning(t('t_need_key')); return; }
    const clean = (texts || []).map(s => String(s || '').trim()).filter(Boolean);
    if (clean.length < 2) { toastr.info(t('t_merge_need2')); return; }
    aiBusy = true; renderPanel();
    try {
        const { user, char } = names();
        const sys = `You merge several long-term-memory summaries (possibly from different chats) into ONE unified, self-contained memory for "${char}" and player "${user}".
Reconcile overlaps, keep every distinct fact, and CLARIFY vague references: if an event, say where and roughly when; if an item, say which one and where it came from; if a relationship claim, say why. Keep chronology sensible even across sources. Do not contradict yourself; if two sources conflict, prefer the more specific/among later one and note the change briefly. Write in ${outLang()}. Return ONLY the merged memory text (200-600 words), no headings, no preamble.`;
        const usr = clean.map((s, i) => `--- SUMMARY ${i + 1} ---\n${s}`).join('\n\n');
        const merged = await callAI(sys, usr);
        if (!merged) { toastr.error(t('t_sum_err')); aiBusy = false; renderPanel(); return; }
        state.summary = merged.trim();
        state.summaries.unshift({ id: genId(), ts: Date.now(), name: 'merge', text: state.summary });
        state.summaries = state.summaries.slice(0, 12);
        if (!Array.isArray(settings.summaryLibrary)) settings.summaryLibrary = [];
        settings.summaryLibrary.unshift({ id: genId(), ts: Date.now(), title: t('merge_label') + ': ' + (getContext().name2 || ''), char: getContext().name2 || '', srcChat: chatKey() || '', chat: (t('merge_label')) + ' · ' + new Date().toLocaleDateString(), text: state.summary, dossier: dossierDigest(state), data: snapshotDossier(), scenes: settings.carryScenes ? buildSceneArchive() : [] });
        settings.summaryLibrary = settings.summaryLibrary.slice(0, 40);
        updateCarry();
        toastr.success(t('t_merged'));
    } catch (e) { toastr.error(t('t_sum_err')); }
    aiBusy = false; editing = null;
    saveState(); renderPanel(); buildInjection();
}

/* ============================================================ AI DIARY ENTRY */
async function generateEntry() {
    if (aiBusy) return;
    if (!settings.apiKey) { toastr.warning(t('t_need_key')); return; }
    const lines = buildTranscript();
    if (!lines.length) { toastr.info(t('t_sum_empty')); return; }
    aiBusy = true; renderPanel();
    try {
        const { user, char } = names();
        const recent = lines.slice(-24).join('\n').slice(-6000);
        const vit = readVitals();
        const st = currentStamp();
        const vitLine = vit ? `Current state: ${vit.hp != null ? `HP ${vit.hp}/${vit.hpMax}` : ''}${(vit.buffs && vit.buffs.length) ? `; conditions: ${vit.buffs.map(b => b.name).join(', ')}` : ''}.` : '';
        const sys = `You ARE "${char}". Write a short, honest FIRST-PERSON diary entry (about 90-160 words) about the most recent scene with "${user}": what happened, what you felt, what it means to you. Intimate, in-character, reflective — not a plot recap. ${vitLine} If wounded or low, let it show. Write in ${outLang()}. Return ONLY the entry text, no title, no quotes.`;
        const text = await callAI(sys, recent);
        if (!text) { toastr.error(t('t_write_err')); aiBusy = false; renderPanel(); return; }
        state.entries.push({
            id: genId(), ts: Date.now(), date: st.label, gameDay: st.day, weather: st.weather, loc: st.loc, locIcon: st.locIcon,
            mood: '', trust: (vit && vit.hp != null) ? null : null, tags: [], text: text.trim(), source: 'ai',
            hp: vit ? vit.hp : null
        });
        ei = state.entries.length - 1;
        toastr.success(t('t_write_done'));
    } catch (e) { toastr.error(t('t_write_err')); }
    aiBusy = false;
    saveState(); renderPanel(); buildInjection();
}

/* ============================================================ CONTRADICTION CHECK */
function keyFactsForCheck() {
    const f = [];
    for (const e of state.events) f.push(`${e.pin ? '[KEY] ' : ''}EVENT — ${e.title}: ${e.what || ''}`);
    for (const n of state.npcs) f.push(`${n.pin ? '[KEY] ' : ''}NPC — ${n.name}: ${n.role || ''}. ${n.note || ''}`);
    for (const g of state.gifts) f.push(`${g.pin ? '[KEY] ' : ''}GIFT — ${g.item} (${g.who || ''})`);
    for (const x of state.glossary) f.push(`${x.pin ? '[KEY] ' : ''}TERM — ${x.term}: ${x.def || ''}`);
    const mem = (state.summary || '').trim();
    if (mem) f.unshift('MEMORY — ' + mem);
    let out = f.join('\n');
    if (out.length > 4000) out = out.slice(0, 4000) + '…';
    return out;
}
async function checkContradictions() {
    if (aiBusy) return;
    if (!settings.apiKey) { toastr.warning(t('t_need_key')); return; }
    const facts = keyFactsForCheck();
    if (!facts.trim()) { toastr.info(t('chk_nofacts')); return; }
    const recent = buildTranscript().slice(-12).join('\n').slice(-5000);
    if (!recent.trim()) { toastr.info(t('t_sum_empty')); return; }
    aiBusy = true; renderPanel();
    try {
        const sys = `You are a continuity checker for a roleplay. You are given ESTABLISHED FACTS and the RECENT SCENE.
Find places where the recent scene CONTRADICTS or forgets an established fact — e.g. a disguise/secret is treated as public knowledge, a debt or promise is ignored, a dead character speaks, someone knows something they were never told, a location or item is wrong.
Be strict but not pedantic: natural development, new information and changing feelings are NOT contradictions. Facts marked [KEY] matter most.
Return STRICT JSON only: {"conflicts":[{"fact":"<the established fact, short>","scene":"<what the scene did instead, short>","severity":"high|low"}]}
If there is nothing wrong, return {"conflicts":[]}. Write in ${outLang()}.`;
        const raw = await callAI(sys, `ESTABLISHED FACTS:\n${facts}\n\nRECENT SCENE:\n${recent}`);
        const obj = parseJSON(raw);
        const list = (obj && Array.isArray(obj.conflicts)) ? obj.conflicts : [];
        aiBusy = false;
        if (!list.length) { toastr.success(t('chk_clean')); renderPanel(); return; }
        editing = { type: 'alerts', list };
        renderPanel();
        toastr.warning(t('chk_found', { n: list.length }));
        return;
    } catch (e) { toastr.error(t('t_sum_err')); }
    aiBusy = false; renderPanel();
}
function alertsForm() {
    const list = (editing && editing.list) || [];
    const rows = list.map(c => `<div class="rd-conflict ${c.severity === 'high' ? 'high' : ''}">
        <div class="rd-cf-f">${escapeHtml(c.fact || '')}</div>
        <div class="rd-cf-s">↯ ${escapeHtml(c.scene || '')}</div></div>`).join('');
    return `<div class="rd-htitle">${t('chk_title')}</div><div class="rd-rule"></div>
        <div class="rd-eyebrow" style="margin-bottom:6px">${t('chk_hint')}</div>
        <div class="rd-edit" style="gap:7px">${rows}</div>
        <div class="rd-acts"><button class="rd-btn rpg-d-cancelf">${t('act_cancel')}</button></div>`;
}

/* ============================================================ HIDDEN INJECTION */
function contextIsFull() {
    try {
        const ctx = getContext();
        const chars = (ctx.chat || []).reduce((a, m) => a + (m && m.mes ? m.mes.length : 0), 0);
        const approx = chars / 4;
        const max = Number(ctx.maxContext) || 8192;
        return approx > max * 0.7;
    } catch (e) { return false; }
}
function chatIsNew() {
    try { return (getContext().chat || []).filter(m => m && !m.is_system).length <= 3; } catch (e) { return false; }
}
/* ---- RAG: smart retrieval (BM25) over ALL memory, date-forward ---- */
const STOPWORDS = new Set(('the and for that with was were has had have his her she him you your they them this from but not are and of to in on it is as at be or an a ' +
    'по что как это был была были быть его ему её они их для так вот уже или же над под при без the a но да нет там тут этот эта они мы вы я ты').split(/\s+/));
function tok(s) {
    return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length >= 3 && !STOPWORDS.has(w));
}
/* ---- raw-scene index: lets the character recall the ACTUAL scene, not just the summary ---- */
function sceneStampFor(chat, i) {
    // walk back for the nearest Scene Card stamp, so an old chunk carries the date it happened on
    for (let k = i; k >= 0 && k > i - 40; k--) {
        const d = chat[k] && chat[k].extra && chat[k].extra.rpg_info_box;
        if (d && (d.date || d.time)) return { date: [d.date, d.time].filter(Boolean).join(' · '), day: sceneDayNumber(d.date), loc: d.location || '' };
    }
    return { date: '', day: null, loc: '' };
}
function sceneChunksAll() { return sceneChunksImpl(0); }
function sceneChunks() {
    if (settings.sceneSearch === false) return [];
    return sceneChunksImpl(Math.max(0, parseInt(settings.sceneSkipTail) || 30));
}
function sceneChunksImpl(skipTail) {
    const ctx = getContext();
    const chat = ctx.chat || [];
    // The tail of the chat is already in the model's context — re-injecting it would just waste budget.
    // We only index what has fallen out of view (skipTail=0 when archiving the whole chat).
    const end = Math.max(0, chat.length - skipTail);
    const out = [];
    let buf = '', from = 0, stamp = null;
    const flush = (to) => {
        const txt = buf.trim();
        if (txt.length > 120) out.push({
            id: 's' + from + '_' + to, type: 'scene', date: (stamp && stamp.date) || '', day: stamp && stamp.day,
            ts: 0, pin: false, name: '', text: txt, extra: (stamp && stamp.loc) || ''
        });
        buf = '';
    };
    for (let i = 0; i < end; i++) {
        const m = chat[i];
        if (!m || m.is_system) continue;
        if (m.extra && m.extra.rpg_diary_memory) continue;
        const who = m.is_user ? (ctx.name1 || 'User') : (m.name || ctx.name2 || 'Character');
        const line = `${who}: ${String(m.mes || '').replace(/\s+/g, ' ').trim()}`;
        if (!line || line.length < 4) continue;
        if (!buf) { from = i; stamp = sceneStampFor(chat, i); }
        buf += (buf ? '\n' : '') + line;
        if (buf.length >= 900) flush(i);
    }
    if (buf) flush(end - 1);
    return out;
}

function memoryChunks() {
    const c = [];
    for (const e of state.entries) c.push({ id: 'e' + e.id, type: 'diary', date: e.date || '', day: e.gameDay, ts: e.ts, pin: !!e.pin, name: '', text: e.text || '', extra: (e.tags || []).join(' ') + ' ' + (e.loc || '') + ' ' + (e.mood || '') });
    // events are the plot backbone — always retrievable, never gated behind the dossier toggle
    for (const v of state.events) c.push({ id: 'v' + v.id, type: 'event', date: v.when || '', day: v.day, ts: v.ts, pin: !!v.pin, name: v.title, text: `${v.title}: ${v.what || ''}`.trim(), extra: (v.where || '') + ' ' + (v.who || '') });
    if (settings.ragDossiers !== false) {
        for (const n of state.npcs) c.push({ id: 'n' + n.id, type: 'npc', date: '', ts: 0, pin: !!n.pin, name: n.name, text: `${n.name}: ${n.role || ''}. ${n.look || ''} ${n.met || ''} ${n.note || ''}`.trim(), extra: n.name });
        for (const g of state.gifts) c.push({ id: 'g' + g.id, type: 'gift', date: g.when || '', ts: 0, pin: !!g.pin, name: g.item, text: `${g.item} — ${g.who || ''}. ${g.why || ''}`.trim(), extra: g.item + ' ' + (g.who || '') });
        for (const l of state.locations) if (l.known) c.push({ id: 'l' + l.id, type: 'loc', date: '', ts: 0, pin: !!l.pin, name: l.name, text: `${l.name}: ${l.desc || ''}`.trim(), extra: l.name });
        for (const gl of state.glossary) c.push({ id: 'x' + gl.id, type: 'gloss', date: '', ts: 0, pin: !!gl.pin, name: gl.term, text: `${gl.term}: ${gl.def || ''}`.trim(), extra: gl.term });
    }
    for (const sc of sceneChunks()) c.push(sc);   // verbatim scenes from the chat itself
    // scenes carried over from a previous chat (only if the user asked for them)
    (state.archiveScenes || []).forEach((a, i) => c.push({ id: 'a' + i, type: 'scene', date: a.date || '', day: a.day, ts: 0, pin: false, name: '', text: a.text || '', extra: '' }));
    return c;
}

/* ---- retrieval helpers ---- */
function recentText() {
    const sc = readScene();
    return (buildTranscript().slice(-6).join(' ') + ' ' + (sc && sc.loc ? sc.loc : '')).toLowerCase();
}
// Entity trigger: if someone/something is being talked about RIGHT NOW, its dossier must be present —
// this is what makes a character actually remember Mari the moment Mari is mentioned.
function triggeredChunks(chunks, hay) {
    const hits = [];
    for (const c of chunks) {
        if (!c.name || c.type === 'diary') continue;
        const nm = String(c.name).toLowerCase().trim();
        if (nm.length < 3) continue;
        // match the first word too, so "Mari" catches "Mari Delacroix"
        const first = nm.split(/\s+/)[0];
        if (hay.includes(nm) || (first.length >= 4 && hay.includes(first))) hits.push(c);
    }
    return hits;
}
// Rank fusion: combine keyword (BM25) and vector (cosine) rankings. Each list votes; items that
// score well on BOTH float to the top. Works with either list alone, so nothing breaks if
// embeddings are off or still warming up.
function rrfRank(chunks, topK) {
    const lists = [];
    const bm = bm25Rank(chunks, queryTokens(), Math.max(topK * 3, 12));
    if (bm.length) lists.push(bm);
    if (embedConfigured()) {
        const vec = cosineRetrieve(chunks, Math.max(topK * 3, 12));
        if (vec && vec.length) lists.push(vec);
    }
    if (!lists.length) return [];
    const score = new Map();
    for (const list of lists) list.forEach((c, i) => score.set(c.id, (score.get(c.id) || 0) + 1 / (60 + i)));
    return chunks.filter(c => score.has(c.id)).sort((a, b) => score.get(b.id) - score.get(a.id)).slice(0, topK);
}
// Keep the injection varied: don't let five diary entries crowd out the one event that matters.
function diversify(list, limit) {
    const perType = { diary: 2, event: 3, npc: 3, gift: 2, loc: 2, gloss: 2, scene: Math.max(0, parseInt(settings.sceneMax) || 2) };
    const used = {}; const out = [];
    for (const c of list) {
        used[c.type] = used[c.type] || 0;
        if (used[c.type] >= (perType[c.type] || 2)) continue;
        used[c.type]++; out.push(c);
        if (out.length >= limit) break;
    }
    if (out.length < limit) for (const c of list) { if (!out.includes(c)) { out.push(c); if (out.length >= limit) break; } }
    return out;
}
function retrieveMemory() {
    if (!settings.injectDiary) return '';
    const chunks = memoryChunks(); if (!chunks.length) return '';
    const ragOn = settings.ragToggle || (settings.injectWhenFull && contextIsFull());
    const limit = Math.max(1, settings.injectEntries || 4);
    const picked = [];
    const push = (c) => { if (c && !picked.some(x => x.id === c.id)) picked.push(c); };

    // 1) pinned facts are non-negotiable — the debt, the disguise, the thing that must never be forgotten
    for (const c of chunks) if (c.pin) push(c);
    if (ragOn) {
        const hay = recentText();
        // 2) whoever/whatever is on-screen right now
        for (const c of triggeredChunks(chunks, hay)) push(c);
        // 3) best semantic/keyword matches, kept varied
        const rest = chunks.filter(c => !picked.some(x => x.id === c.id));
        for (const c of diversify(rrfRank(rest, limit * 2), limit)) push(c);
    } else {
        for (const e of state.entries.slice(-limit)) push({ id: 'e' + e.id, type: 'diary', date: e.date, day: e.gameDay, text: e.text });
    }
    // oldest → newest reads like a timeline; undated dossier items sink to the end
    picked.sort((a, b) => (a.day ?? 1e9) - (b.day ?? 1e9) || (a.ts || 0) - (b.ts || 0));
    let out = picked.map(formatChunk).join('\n');
    const budget = settings.injectBudget || 1400;
    if (out.length > budget) out = out.slice(0, budget) + '…';
    return out;
}
function snapshotDossier() {
    const strip = (o) => { const c = Object.assign({}, o); delete c.portrait; return c; };
    return {
        bond: state.bond ? JSON.parse(JSON.stringify(state.bond)) : null,
        notes: state.notes || '',
        entries: state.entries.map(strip),
        events: state.events.map(strip),
        npcs: state.npcs.map(strip),
        locations: state.locations.map(strip),
        gifts: state.gifts.map(strip),
        glossary: state.glossary.map(strip)
    };
}
// Older saved memories (made before structured carry existed) have no snapshot — rebuild one straight
// from the source chat's diary, so they carry everything too.
function snapshotFromChat(chatId) {
    const src = settings.chatStates && settings.chatStates[chatId];
    if (!src) return null;
    const strip = (o) => { const c = Object.assign({}, o); delete c.portrait; return c; };
    return {
        bond: src.bond ? JSON.parse(JSON.stringify(src.bond)) : null,
        notes: src.notes || '',
        entries: (src.entries || []).map(strip),
        events: (src.events || []).map(strip),
        npcs: (src.npcs || []).map(strip),
        locations: (src.locations || []).map(strip),
        gifts: (src.gifts || []).map(strip),
        glossary: (src.glossary || []).map(strip)
    };
}
function dossierDigest(s) {
    const parts = [];
    if (s.bond && typeof s.bond.trust === 'number') parts.push(`BOND — ${(getContext().name2 || 'the character')}: ${s.bond.trust}/100${s.bond.status ? ' — ' + s.bond.status : ''}`);
    if (s.events.length) parts.push(t('tab_evt') + ' — ' + s.events.map(e => `${e.title}${e.when ? ` (${e.when})` : ''}${e.where ? `, ${e.where}` : ''}: ${e.what || ''}`).join('; '));
    if (s.npcs.length) parts.push('NPCs — ' + s.npcs.map(n => `${n.name}${n.role ? ` (${n.role})` : ''}${typeof n.trust === 'number' ? ` [${t('relationship')}: ${n.trust}]` : ''}${n.note ? `: ${n.note}` : ''}`).join('; '));
    if (s.gifts.length) parts.push((t('tab_gift')) + ' — ' + s.gifts.map(g => `${g.dir} ${g.item} (${g.who}${g.when ? `, ${g.when}` : ''}${g.why ? ` — ${g.why}` : ''})`).join('; '));
    const known = s.locations.filter(l => l.known);
    if (known.length) parts.push((t('tab_loc')) + ' — ' + known.map(l => l.name).join(', '));
    if (s.glossary.length) parts.push((t('tab_gloss')) + ' — ' + s.glossary.map(g => `${g.term}: ${g.def || ''}`).join('; '));
    let out = parts.join('\n');
    if (out.length > 1600) out = out.slice(0, 1600) + '…';
    return out;
}
function buildSceneArchive() {
    const cap = Math.max(1, parseInt(settings.carrySceneMax) || 40);
    const all = (settings.sceneSearch === false)
        ? []
        : sceneChunksAll();                       // whole chat, not just the part outside context
    return all.slice(-cap).map(c => ({ date: c.date, day: c.day, text: c.text }));
}
function updateCarry() {
    if (!state || !settings.carryOver) return;
    const mem = (state.summary || '').trim();
    if (!mem) return; // never overwrite a good carry-over with an empty one
    settings.carry = { summary: mem, dossier: dossierDigest(state), data: snapshotDossier(), scenes: settings.carryScenes ? buildSceneArchive() : [], ts: Date.now(), char: getContext().name2 || '', from: chatKey() || '' };
}
function bm25Rank(chunks, q, topK) {
    const N = chunks.length; if (!N || !q.length) return [];
    const docs = chunks.map(c => tok(c.text + ' ' + (c.extra || '')));
    const df = {};
    docs.forEach(d => { const seen = new Set(d); seen.forEach(w => df[w] = (df[w] || 0) + 1); });
    const avgdl = docs.reduce((a, d) => a + d.length, 0) / N || 1;
    const k1 = 1.5, b = 0.75;
    const scored = chunks.map((c, i) => {
        const d = docs[i], dl = d.length || 1, tf = {};
        d.forEach(w => tf[w] = (tf[w] || 0) + 1);
        let s = 0;
        for (const w of q) {
            const f = tf[w] || 0; if (!f) continue;
            const idf = Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5));
            s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * dl / avgdl));
        }
        return { c, s: s + (c.ts ? c.ts / 1e14 : 0) }; // tiny recency tie-breaker
    });
    return scored.filter(x => x.s > 0).sort((a, b2) => b2.s - a.s).slice(0, topK).map(x => x.c);
}
function queryTokens() {
    const recent = buildTranscript().slice(-6).join(' ');
    const sc = readScene();
    return tok(recent + ' ' + (sc && sc.loc ? sc.loc : ''));
}
function relDay(day) {
    if (day == null) return '';
    const sc = readScene(); const cur = sc && sc.day;
    if (cur == null || cur === day) return '';
    const diff = cur - day;
    return diff > 0 ? ` · ${diff} ${t('days_ago')}` : '';
}
function typeTag(type) { return type === 'scene' ? (t('scene_tag') + ' — ') : type === 'event' ? (t('tab_evt') + ' — ') : type === 'npc' ? 'NPC — ' : type === 'gift' ? (t('tab_gift') + ' — ') : type === 'loc' ? (t('tab_loc') + ' — ') : type === 'gloss' ? (t('tab_gloss') + ' — ') : ''; }
function formatChunk(c) {
    const when = c.date ? `[${c.date}${relDay(c.day)}] ` : '';
    const pin = c.pin ? '📌 ' : '';
    let body = c.text;
    if (c.type === 'scene' && body.length > 420) body = body.slice(0, 420) + '…';   // a recalled scene, not a re-run of the chat
    return `• ${pin}${when}${typeTag(c.type)}${body}`;
}
function buildInjection() {
    const clear = () => setExtensionPrompt(PROMPT_KEY, '', 2, 0, false, extension_prompt_roles.SYSTEM);
    if (!settings.enabled || !state) { clear(); return; }
    // Collect-only mode: keep writing the diary, but inject nothing into the prompt.
    if (settings.injectMemory === false) { clear(); return; }
    const blocks = [];
    const sc = readScene();
    const nowLine = (sc && (sc.label || sc.loc)) ? `${t('inj_now')}: ${[sc.label, sc.loc].filter(Boolean).join(' · ')}` : '';
    if (nowLine) blocks.push(nowLine);
    let mem = (state.summary || '').trim();
    let dossier = '';
    let carried = false;
    if (!mem) {
        // This chat has no memory of its own. Should we lend it memory from elsewhere?
        // Never blindly: a new chat with a DIFFERENT character must not inherit someone else's story.
        const c = settings.carry;
        const mode = settings.carryMode || 'char';
        const sameChar = c && c.char && c.char === (getContext().name2 || '');
        const allowed = settings.carryOver && c && c.summary && mode !== 'off' && (mode === 'all' || sameChar);
        if (allowed) {
            mem = c.summary.trim(); carried = true;
            if (settings.carryDossier && c.dossier) dossier = c.dossier.trim();
            if (settings.carryScenes && Array.isArray(c.scenes) && c.scenes.length && !(state.archiveScenes || []).length) state.archiveScenes = c.scenes;
            if (settings.carryDossier && !state.carriedApplied) { const d = c.data || snapshotFromChat(c.from); if (d) { applyDossierData(d); state.carriedApplied = true; saveState(false); } }
        }
    } else if (settings.carryDossier && state.carriedDossier) {
        dossier = String(state.carriedDossier).trim();
    }
    if (mem && settings.injectSummary !== false) blocks.push(`${t('inj_memory_head')}\n${mem}`);
    if (dossier) blocks.push(`${t('inj_dossier_head')}\n${dossier}`);
    const anchorList = [];
    const { char } = names();
    if (state.bond && typeof state.bond.trust === 'number')
        anchorList.push(`${char}: ${state.bond.trust}/100${state.bond.status ? ' — ' + state.bond.status : ''}`);
    for (const n of state.npcs) if (typeof n.trust === 'number' && n.trust >= 50) anchorList.push(`${n.name}: ${n.trust}/100`);
    if (anchorList.length) blocks.push(`${t('inj_anchor_head')}\n${anchorList.join('; ')}\n${t('inj_anchor_note')}`);
    const extras = retrieveMemory();
    if (extras) blocks.push(`${t('inj_diary_head')}\n${extras}`);
    if (settings.notesToAI && state.notes && state.notes.trim()) blocks.push(`Player notes:\n${state.notes.trim()}`);
    const hasContent = (mem && settings.injectSummary !== false) || extras || dossier || anchorList.length;
    if (!hasContent) { clear(); return; }
    // respect "inject on new chat" only for this chat's own diary; carried memory is meant for new chats
    if (chatIsNew() && settings.injectOnNew === false && !settings.ragToggle && !carried) { clear(); return; }
    const text = `\n[${t('inj_wrap')} — ${t('inj_hint')}]\n${blocks.join('\n\n')}\n[/${t('inj_wrap')}]\n`;
    const depth = (settings.injectMode === 'top' || settings.injectMode === 'both') ? 9999 : (settings.injectDepth || 4);
    setExtensionPrompt(PROMPT_KEY, text, 2, depth, false, extension_prompt_roles.SYSTEM);
}

/* ============================================================ UI STATE */
let query = '';
let tab = 0, ei = 0, bondSel = 0, evtSel = 0, npcSel = 0, locSel = 0, giftSel = 0, editing = null, bookOpen = false;
const TABS = [['tab_diary', 'book', 't0'], ['tab_mem', 'key', 't7'], ['tab_bond', 'heart', 't6'], ['tab_evt', 'spark', 't5'], ['tab_npc', 'user', 't1'], ['tab_loc', 'map', 't2'], ['tab_gift', 'gift', 't3'], ['tab_gloss', 'gloss', 't4']];
const TAB_IDS = ['diary', 'mem', 'bond', 'evt', 'npc', 'loc', 'gift', 'gloss'];

function searchBox() {
    return `<input class="rd-search rpg-d-q" type="search" placeholder="${escapeHtml(t('search_ph'))}" value="${escapeHtml(query)}">`;
}
function matchQ(...fields) {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return fields.some(f => String(f || '').toLowerCase().includes(q));
}
function pinBtn(type, id, pinned) {
    return `<button class="rd-btn ${pinned ? 'gold' : ''} rpg-d-pin" data-type="${type}" data-id="${id}" title="${escapeHtml(t('pin_hint'))}">${pinned ? '📌 ' + t('pinned') : '📌 ' + t('pin')}</button>`;
}
function togglePin(type, id) {
    const it = findItem(type, id); if (!it) return;
    it.pin = !it.pin;
    saveState(); renderPanel(); buildInjection();
    toastr.info(it.pin ? t('pin_on') : t('pin_off'));
}
function bar(v, c) { return `<div class="rd-bar"><i style="width:${clamp(v, 0, 100)}%;background:${c}"></i></div>`; }
function trustPeak(n) { const h = n.trustHistory || []; return h.reduce((m, p) => Math.max(m, p.v), (typeof n.trust === 'number' ? n.trust : 0)); }
function sparkline(n) {
    const h = (n.trustHistory || []).map(p => p.v);
    if (typeof n.trust === 'number') h.push(n.trust);
    if (h.length < 2) return '';
    const W = 250, H = 34, max = 100;
    const pts = h.map((v, i) => `${(i / (h.length - 1)) * W},${H - (v / max) * (H - 4) - 2}`).join(' ');
    const drop = trustPeak(n) - (typeof n.trust === 'number' ? n.trust : 0);
    const col = drop >= 25 ? 'var(--oxblood)' : 'var(--green)';
    return `<div class="rd-spark">
        <div class="rd-l"><span>${escapeHtml(t('drift'))}</span><span>${h[0]}% → ${h[h.length - 1]}%</span></div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>
        ${drop >= 25 ? `<div class="rd-warn">⚠ ${escapeHtml(t('drift_warn', { peak: trustPeak(n), now: n.trust }))}</div>` : ''}
    </div>`;
}
function statRow(label, v, c) { return `<div class="rd-stat"><div class="rd-l"><span>${escapeHtml(label)}</span><span>${clamp(v, 0, 100)}%</span></div>${bar(v, c)}</div>`; }
function authorName() { return (state && state.author) || getContext().name2 || 'Character'; }

/* ---------- DIARY ---------- */
// Everyone whose feelings we track: the focus character first, then the NPCs.
function memL() {
    const mem = (state.summary || '').trim();
    const words = mem ? mem.split(/\s+/).length : 0;
    const done = state.summarizedCount || 0;
    const total = buildTranscript().length;
    const behind = Math.max(0, total - done);
    const head = `<div class="rd-eyebrow">${t('mem_h1')}</div><div class="rd-htitle">${t('tab_mem')}</div>
        <div class="rd-meta"><b>${t('mem_words')}:</b> ${words} · <b>${t('mem_covered')}:</b> ${done}/${total}${behind ? ` · <span style="color:var(--oxblood)">${t('mem_behind', { n: behind })}</span>` : ` · ${t('mem_uptodate')}`}</div>
        <div class="rd-rule"></div>`;
    const lockBtn = `<button class="rd-btn ${state.memoryLocked ? 'gold' : ''} rpg-d-memlock" title="${escapeHtml(t('mem_lock_hint'))}">${state.memoryLocked ? '🔒 ' + t('mem_locked') : '🔓 ' + t('mem_lock')}</button>`;
    const draft0 = (state.pendingMemory || '').trim();
    if (!mem) return head
        + (state.memoryLocked ? `<div class="rd-warn" style="margin-bottom:6px">🔒 ${escapeHtml(t('mem_lock_on'))}</div>` : '')
        + (draft0 ? `<div class="rd-draft">
            <div class="rd-eyebrow">${t('mem_draft')}</div>
            <div class="rd-draft-t">${escapeHtml(draft0.slice(0, 220))}…</div>
            <div class="rd-acts">
                <button class="rd-btn rpg-d-draft-apply">${t('mem_draft_apply')}</button>
                <button class="rd-btn rpg-d-draft-drop">${t('mem_draft_drop')}</button>
            </div></div>` : `<div class="rd-empty">${t('mem_none')}</div>`)
        + `<div class="rd-acts"><button class="rd-btn prim rpg-d-sum">${t('act_summarize')}</button>
            ${lockBtn}
            <button class="rd-btn rpg-d-continue">${t('cont_btn')}</button></div>`;
    const draft = (state.pendingMemory || '').trim();
    const draftCard = draft ? `<div class="rd-draft">
            <div class="rd-eyebrow">${t('mem_draft')}</div>
            <div class="rd-draft-t">${escapeHtml(draft.slice(0, 220))}…</div>
            <div class="rd-acts">
                <button class="rd-btn rpg-d-draft-apply">${t('mem_draft_apply')}</button>
                <button class="rd-btn rpg-d-draft-append">${t('mem_draft_append')}</button>
                <button class="rd-btn rpg-d-draft-drop">${t('mem_draft_drop')}</button>
            </div></div>` : '';
    return head + `<div class="rd-entry" style="flex:1;overflow-y:auto"><p>${escapeHtml(mem).replace(/\n/g, '<br>')}</p></div>
        ${draftCard}
        <div class="rd-acts">
            <button class="rd-btn prim rpg-d-sum">${t('act_summarize')}</button>
            ${lockBtn}
            <button class="rd-btn rpg-d-memedit">${t('mem_edit')}</button>
            <button class="rd-btn rpg-d-libsave">${t('mem_tolib')}</button>
            <button class="rd-btn rpg-d-resum" title="${escapeHtml(t('act_resum'))}">⟲</button>
        </div>`;
}
function memR() {
    const lib = Array.isArray(settings.summaryLibrary) ? settings.summaryLibrary : [];
    const head = `<div class="rd-eyebrow">${t('mem_lib_h')}</div><div class="rd-htitle">${t('mem_lib')}</div>
        <div class="rd-eyebrow" style="margin-bottom:6px">${t('mem_lib_hint')}</div><div class="rd-rule"></div>`;
    const acts = `<div class="rd-acts"><button class="rd-btn rpg-d-continue">${t('cont_btn')}</button>
        <button class="rd-btn rpg-d-merge">${t('merge_btn')}</button></div>`;
    const vers = (state.summaries || []);
    const versBlock = vers.length ? `<div class="rd-rule"></div>
        <div class="rd-eyebrow">${t('mem_versions')} (${vers.length})</div>
        <div class="rd-eyebrow" style="margin:3px 0 6px;color:var(--sepia)">${t('mem_versions_hint')}</div>
        ${vers.slice(0, 8).map(v => `<div class="rd-lrow" style="cursor:default;align-items:center;margin-bottom:5px">
            <div style="flex:1;min-width:0">
                <div class="rd-sub">${escapeHtml(new Date(v.ts).toLocaleString())} · ${v.words || (v.text || '').split(/\s+/).length} ${escapeHtml(t('mem_words_short'))}</div>
                <div style="font-size:12px;color:var(--ink-soft);margin-top:2px">${escapeHtml((v.text || '').slice(0, 70))}…</div>
            </div>
            <button class="rd-mini rpg-d-verrestore" data-id="${v.id}" title="${escapeHtml(t('mem_restore'))}">⟲</button>
        </div>`).join('')}` : '';
    if (!lib.length) return head + `<div class="rd-empty">${t('no_library')}</div>` + versBlock + acts;
    return head + `<div class="rd-listcol">${lib.map(sm => `<div class="rd-lrow" style="cursor:default;align-items:flex-start">
        <div style="flex:1;min-width:0">
            <div class="rd-nm">${escapeHtml(libTitle(sm))}</div>
            <div class="rd-sub">${libMeta(sm)}</div>
            <div style="font-size:12px;color:var(--ink-soft);margin-top:3px">${escapeHtml((sm.text || '').slice(0, 110))}…</div>
        </div>
        <button class="rd-mini rpg-d-libren" data-id="${sm.id}" title="${escapeHtml(t('lib_rename'))}">✎</button>
        <button class="rd-mini rpg-d-libdel" data-id="${sm.id}" title="${escapeHtml(t('lib_del'))}">✕</button>
    </div>`).join('')}</div>` + versBlock + acts;
}
function toggleMemLock() {
    state.memoryLocked = !state.memoryLocked;
    saveState(); renderPanel();
    toastr.info(state.memoryLocked ? t('mem_lock_on') : t('mem_lock_off'));
}
function applyDraft(mode) {
    const draft = (state.pendingMemory || '').trim();
    if (!draft) return;
    const cur = (state.summary || '').trim();
    if (mode === 'drop') { state.pendingMemory = ''; saveState(); renderPanel(); return; }
    if (cur) { state.summaries.unshift({ id: genId(), ts: Date.now(), name: getContext().name2 || '', text: cur, words: cur.split(/\s+/).length }); state.summaries = state.summaries.slice(0, 20); }
    state.summary = (mode === 'append' && cur) ? (cur + '\n\n— — —\n' + draft) : draft;
    state.pendingMemory = '';
    updateCarry(); saveState(); renderPanel(); buildInjection();
    toastr.success(t('mem_saved'));
}
function restoreVersion(id) {
    const v = (state.summaries || []).find(x => x.id === id); if (!v) return;
    if (!confirm(t('mem_restore_confirm'))) return;
    const cur = (state.summary || '').trim();
    if (cur) state.summaries.unshift({ id: genId(), ts: Date.now(), name: getContext().name2 || '', text: cur, words: cur.split(/\s+/).length });
    state.summary = v.text;
    state.summaries = state.summaries.slice(0, 20);
    updateCarry(); saveState(); renderPanel(); buildInjection();
    toastr.success(t('mem_restored'));
}
function bondList() {
    const out = [];
    if (state.bond && typeof state.bond.trust === 'number')
        out.push({ kind: 'main', name: authorName(), trust: state.bond.trust, status: state.bond.status || '', history: state.bond.history || [], portrait: '' });
    for (const n of state.npcs) if (typeof n.trust === 'number')
        out.push({ kind: 'npc', id: n.id, name: n.name, role: n.role || '', trust: n.trust, status: n.note || '', history: n.trustHistory || [], portrait: n.portrait || '' });
    return out;
}
function bondL() {
    const list = bondList();
    const head = `<div class="rd-eyebrow">${t('bond_h1')}</div><div class="rd-htitle">${t('tab_bond')}</div><div class="rd-rule"></div>`;
    if (!list.length) return head + `<div class="rd-empty">${t('no_bond')}</div>`;
    return head + `<div class="rd-listcol">${list.map((b, i) => {
        const peak = (b.history || []).reduce((m, p) => Math.max(m, p.v), b.trust);
        const cold = peak - b.trust >= 25;
        return `<button class="rd-lrow ${i === bondSel ? 'sel' : ''}" data-i="${i}">
            <div class="rd-av">${b.portrait ? `<img src="${escapeHtml(b.portrait)}">` : I(b.kind === 'main' ? G.heart : G.user)}</div>
            <div style="flex:1;min-width:0">
                <div class="rd-nm">${escapeHtml(b.name)}${b.kind === 'main' ? ' ★' : ''}${cold ? ' ⚠' : ''}</div>
                <div class="rd-bmini">${bar(b.trust, b.kind === 'main' ? 'linear-gradient(90deg,#8a2c23,#c1663a)' : 'linear-gradient(90deg,#5e3a96,#7e57c2)')}</div>
            </div>
            <span class="rd-bpct">${b.trust}%</span>
        </button>`;
    }).join('')}</div>`;
}
function bondR() {
    const list = bondList();
    const b = list[bondSel];
    if (!b) return `<div class="rd-locked"><div class="rd-q">?</div><p>${t('no_bond')}</p></div>`;
    const fake = { trust: b.trust, trustHistory: b.history };
    const peak = (b.history || []).reduce((m, p) => Math.max(m, p.v), b.trust);
    return `<div class="rd-fade">
        <div class="rd-photo" style="transform:rotate(-1.2deg);width:150px;margin:0 auto 8px">
            <div class="rd-pic" style="height:120px">${b.portrait ? `<img src="${escapeHtml(b.portrait)}">` : I(b.kind === 'main' ? G.heart : G.user, 1.2)}</div>
            <div class="rd-cap">${escapeHtml(b.name)}</div></div>
        ${b.role ? `<div class="rd-meta"><b>${t('occupation')}:</b> ${escapeHtml(b.role)}</div>` : ''}
        ${statRow(b.kind === 'main' ? t('bond_label', { name: b.name }) : t('relationship'), b.trust, b.kind === 'main' ? 'linear-gradient(90deg,#8a2c23,#c1663a)' : 'linear-gradient(90deg,#5e3a96,#7e57c2)')}
        ${sparkline(fake)}
        <div class="rd-meta" style="margin-top:6px"><b>${t('bond_peak')}:</b> ${peak}%</div>
        ${b.status ? `<div class="rd-rule"></div><div style="font-size:13.5px;line-height:1.6;font-style:italic">${escapeHtml(b.status)}</div>` : ''}
        ${b.kind === 'npc' ? `<div class="rd-acts"><button class="rd-btn rpg-d-edit" data-type="npc" data-id="${b.id}">${t('act_edit')}</button></div>` : ''}
    </div>`;
}
function feedL() {
    const es = state.entries.filter(e => matchQ(e.text, e.date, e.loc, e.mood, (e.tags || []).join(' ')));
    const head = `<div class="rd-author"><span class="rd-aav">${I(G.user)}</span> ${t('kept_by')} <b>${escapeHtml(authorName())}</b> <button class="rd-mini rpg-d-editauthor" title="${escapeHtml(t('f_author'))}">✎</button></div>
        <div class="rd-htitle">${t('tab_diary')}</div>
        <div class="rd-eyebrow" style="color:var(--sepia)">${es.length ? t('entries_n', { n: es.length }) : ''}</div>
        ${searchBox()}
        <div class="rd-rule"></div>`;
    const acts = `<div class="rd-acts">
        <button class="rd-btn prim rpg-d-sum">${t('act_summarize')}</button>
        <button class="rd-btn rpg-d-resum" title="${escapeHtml(t('act_resum'))}">⟲</button>
        <button class="rd-btn rpg-d-write">${t('act_write')}</button>
        <button class="rd-btn rpg-d-check">${t('chk_btn')}</button>
        <button class="rd-btn rpg-d-merge">${t('merge_btn')}</button>
        <button class="rd-btn rpg-d-continue">${t('cont_btn')}</button>
        <button class="rd-btn rpg-d-add" data-type="entry">${t('act_add')}</button></div>`;
    if (!es.length) return head + `<div class="rd-empty">${t('no_entries')}</div>` + acts;
    const feed = `<div class="rd-feed">${es.map((e) => { const i = state.entries.indexOf(e); return `<button class="rd-frow ${i === ei ? 'sel' : ''}" data-e="${i}">
        <div class="rd-fdate">${escapeHtml(e.date || '')}</div>
        <div class="rd-fprev">${escapeHtml((e.text || '').slice(0, 100))}…</div>
        <div class="rd-fchips">${e.pin ? '<span class="rd-chip">📌</span>' : ''}${e.mood ? `<span class="rd-chip">${escapeHtml(e.mood)}</span>` : ''}<span class="rd-floc">${I(G[e.locIcon] || G.pin)}</span></div>
    </button>`; }).join('')}</div>`;
    return head + feed + acts;
}
function fullR(e) {
    if (!e) return `<div class="rd-locked"><div class="rd-q">?</div><p>${t('no_entries')}</p></div>`;
    const txt = escapeHtml(e.text || '').replace(/^(.)/, '<span class="rd-drop">$1</span>');
    const stampTxt = e.source === 'manual' ? t('stamp_manual') : t('stamp_rag');
    const trustRow = (typeof e.trust === 'number') ? statRow(t('trust'), e.trust, 'linear-gradient(90deg,#5e3a96,#7e57c2)') : '';
    return `<div class="rd-fade">
        <span class="rd-clip" style="top:-8px;right:40px;transform:rotate(6deg)"></span>
        <div class="rd-photo" style="transform:rotate(-1.4deg)"><div class="rd-pic" style="height:${e.portrait ? 132 : 92}px">${e.portrait ? `<img src="${escapeHtml(e.portrait)}">` : I(G[e.locIcon] || G.pin, 1.4)}</div><div class="rd-cap">${escapeHtml(e.loc || authorName())}</div></div>
        <div class="rd-band" style="margin:12px 0 2px">${escapeHtml(e.date || '')}<span class="rd-mk"></span></div>
        <div class="rd-meta">${e.weather ? `<b>${t('weather')}</b> ${escapeHtml(e.weather)} · ` : ''}${e.mood ? `<b>${t('mood')}</b> ${escapeHtml(e.mood)}` : ''}</div>
        <div class="rd-entry" style="margin:8px 0;flex:none;overflow:visible"><p>${txt}</p></div>
        ${trustRow}
        ${(e.tags && e.tags.length) ? `<div class="rd-chips">${e.tags.map(x => `<span class="rd-chip">${escapeHtml(x)}</span>`).join('')}</div>` : ''}
        <div class="rd-acts">${pinBtn('entry', e.id, e.pin)}<button class="rd-btn rpg-d-edit" data-type="entry" data-id="${e.id}">${t('act_edit')}</button>
        <button class="rd-btn rpg-d-del" data-type="entry" data-id="${e.id}">${t('act_del')}</button></div>
        <div class="rd-genstamp" style="margin-top:8px">${I(G.spark)}${stampTxt}</div>
    </div>`;
}

/* ---- EVENTS ---- */
function evtListL() {
    const list = state.events.filter(e => matchQ(e.title, e.what, e.when, e.where, e.who));
    const head = `<div class="rd-eyebrow">${t('evt_h1')}</div><div class="rd-htitle">${t('tab_evt')}</div>${searchBox()}<div class="rd-rule"></div>`;
    const acts = `<div class="rd-acts"><button class="rd-btn rpg-d-add" data-type="evt">${t('act_add')}</button></div>`;
    if (!list.length) return head + `<div class="rd-empty">${t('no_evt')}</div>` + acts;
    return head + `<div class="rd-listcol">${list.map((e) => { const i = state.events.indexOf(e); return `<button class="rd-lrow ${i === evtSel ? 'sel' : ''}" data-i="${i}">
        <div class="rd-av" style="color:var(--oxblood)">${I(G.spark)}</div>
        <div style="flex:1"><div class="rd-nm">${e.pin ? '📌 ' : ''}${escapeHtml(e.title)}</div><div class="rd-sub">${escapeHtml([e.when, e.where].filter(Boolean).join(' · '))}</div></div></button>`; }).join('')}</div>` + acts;
}
function evtR() {
    const e = state.events[evtSel]; if (!e) return `<div class="rd-locked"><div class="rd-q">?</div><p>${t('no_evt')}</p></div>`;
    return `<div class="rd-fade">
        <span class="rd-clip" style="top:-8px;right:44px;transform:rotate(4deg)"></span>
        ${e.portrait ? `<div class="rd-photo" style="transform:rotate(1.2deg);width:170px;margin:0 auto 8px"><div class="rd-pic" style="height:120px"><img src="${escapeHtml(e.portrait)}"></div><div class="rd-cap">${escapeHtml(e.title)}</div></div>` : ''}
        <div class="rd-band" style="margin-top:6px">${escapeHtml(e.title)}<span class="rd-mk"></span></div>
        <div class="rd-meta">${e.when ? `<b>${t('f_when')}:</b> ${escapeHtml(e.when)}<br>` : ''}${e.where ? `<b>${t('f_where')}:</b> ${escapeHtml(e.where)}<br>` : ''}${e.who ? `<b>${t('f_who2')}:</b> ${escapeHtml(e.who)}` : ''}</div>
        <div class="rd-rule"></div>
        <div class="rd-entry" style="flex:none;overflow:visible"><p>${escapeHtml(e.what || '')}</p></div>
        <div class="rd-acts">${pinBtn('evt', e.id, e.pin)}<button class="rd-btn rpg-d-edit" data-type="evt" data-id="${e.id}">${t('act_edit')}</button>
        <button class="rd-btn rpg-d-del" data-type="evt" data-id="${e.id}">${t('act_del')}</button></div>`;
}

/* ---- NPC ---- */
function npcListL() {
    const list = state.npcs.filter(n => matchQ(n.name, n.role, n.look, n.met, n.note));
    const head = `<div class="rd-eyebrow">${t('dossier')}</div><div class="rd-htitle">${t('known_faces')}</div>${searchBox()}<div class="rd-rule"></div>`;
    const acts = `<div class="rd-acts"><button class="rd-btn rpg-d-add" data-type="npc">${t('act_add')}</button></div>`;
    if (!list.length) return head + `<div class="rd-empty">${t('no_npc')}</div>` + acts;
    return head + `<div class="rd-listcol">${list.map((n) => { const i = state.npcs.indexOf(n); return `<button class="rd-lrow ${i === npcSel ? 'sel' : ''}" data-i="${i}">
        <div class="rd-av">${n.portrait ? `<img src="${escapeHtml(n.portrait)}">` : I(G.user)}</div>
        <div><div class="rd-nm">${n.pin ? '📌 ' : ''}${escapeHtml(n.name)}</div><div class="rd-sub">${escapeHtml(n.role || '')}</div></div></button>`; }).join('')}</div>` + acts;
}
function npcR() {
    const n = state.npcs[npcSel]; if (!n) return `<div class="rd-locked"><div class="rd-q">?</div><p>${t('no_npc')}</p></div>`;
    return `<div class="rd-fade"><span class="rd-clip" style="top:-8px;right:44px;transform:rotate(-7deg)"></span>
        <div class="rd-photo" style="transform:rotate(1.5deg);width:150px;margin:0 auto 4px"><div class="rd-pic" style="height:150px">${n.portrait ? `<img src="${escapeHtml(n.portrait)}">` : I(G.user, 1.3)}</div><div class="rd-cap">${escapeHtml(n.name)}</div></div>
        <div class="rd-meta"><b>${t('occupation')}:</b> ${escapeHtml(n.role || '—')}</div>
        ${typeof n.trust === 'number' ? statRow(t('relationship'), n.trust, 'linear-gradient(90deg,#8a2c23,#c1663a)') : ''}
        ${sparkline(n)}
        <div class="rd-rule"></div>
        <div style="font-size:13.5px;line-height:1.55">
            ${n.look ? `<span class="rd-eyebrow">${t('appearance')}</span><br>${escapeHtml(n.look)}<br><br>` : ''}
            ${n.met ? `<span class="rd-eyebrow">${t('how_met')}</span><br>${escapeHtml(n.met)}<br><br>` : ''}
            ${n.note ? `<span class="rd-eyebrow">${t('note')}</span><br><i>${escapeHtml(n.note)}</i>` : ''}
        </div>
        <div class="rd-acts">${pinBtn('npc', n.id, n.pin)}<button class="rd-btn rpg-d-edit" data-type="npc" data-id="${n.id}">${t('act_edit')}</button>
        <button class="rd-btn rpg-d-del" data-type="npc" data-id="${n.id}">${t('act_del')}</button></div>`;
}

/* ---------- LOCATIONS ---------- */
function locGridL() {
    const head = `<div class="rd-eyebrow">${t('travel_log')}</div><div class="rd-htitle">${t('locations')}</div><div class="rd-rule"></div>`;
    const acts = `<div class="rd-acts"><button class="rd-btn rpg-d-add" data-type="loc">${t('act_add')}</button></div>`;
    if (!state.locations.length) return head + `<div class="rd-empty">${t('no_loc')}</div>` + acts;
    return head + `<div class="rd-grid">${state.locations.map((l, i) => `<div class="rd-gcell ${l.known ? '' : 'lock'} ${i === locSel ? 'sel' : ''}" data-i="${i}">
        <div class="rd-disc">${l.known ? (l.portrait ? `<img src="${escapeHtml(l.portrait)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : I(G[l.icon] || G.pin, 1.4)) : '<span style="font-family:Caveat;font-size:26px;color:#b6a479">?</span>'}</div>
        <div class="rd-gl">${l.known ? escapeHtml(l.name) : '???'}</div></div>`).join('')}</div>` + acts;
}
function locR() {
    const l = state.locations[locSel]; if (!l) return `<div class="rd-locked"><div class="rd-q">?</div><p>${t('no_loc')}</p></div>`;
    if (!l.known) return `<div class="rd-locked rd-fade"><div class="rd-q">?</div><p>${t('loc_locked')}</p></div>`;
    return `<div class="rd-fade"><span class="rd-clip" style="top:-8px;right:40px;transform:rotate(5deg)"></span>
        <div class="rd-photo" style="transform:rotate(-1.5deg)"><div class="rd-pic">${l.portrait ? `<img src="${escapeHtml(l.portrait)}">` : I(G[l.icon] || G.pin, 1.3)}</div><div class="rd-cap">${escapeHtml(l.name)}</div></div>
        <div class="rd-rule"></div>
        <div class="rd-band">${escapeHtml(l.name)}<span class="rd-mk"></span></div>
        <p style="font-size:14px;line-height:1.6;margin-top:10px">${escapeHtml(l.desc || '')}</p>
        <div class="rd-acts">${pinBtn('loc', l.id, l.pin)}<button class="rd-btn rpg-d-edit" data-type="loc" data-id="${l.id}">${t('act_edit')}</button>
        <button class="rd-btn rpg-d-del" data-type="loc" data-id="${l.id}">${t('act_del')}</button></div>`;
}

/* ---------- GIFTS ---------- */
function giftsL() {
    const head = `<div class="rd-eyebrow">${t('gifts_h1')}</div><div class="rd-htitle">${t('gifts_h2')}</div><div class="rd-rule"></div>`;
    const acts = `<div class="rd-acts"><button class="rd-btn rpg-d-add" data-type="gift">${t('act_add')}</button></div>`;
    if (!state.gifts.length) return head + `<div class="rd-empty">${t('no_gift')}</div>` + acts;
    return head + `<div class="rd-listcol">${state.gifts.map((g, i) => `<button class="rd-lrow ${i === giftSel ? 'sel' : ''}" data-i="${i}">
        <div class="rd-av" style="color:${g.dir === '→' ? 'var(--green)' : 'var(--oxblood)'}">${I(G.gift)}</div>
        <div><div class="rd-nm">${escapeHtml(g.item)}</div><div class="rd-sub">${escapeHtml(g.who || '')}${g.when ? ' · ' + escapeHtml(g.when) : ''}</div></div></button>`).join('')}</div>` + acts;
}
function giftsR() {
    const g = state.gifts[giftSel]; if (!g) return `<div class="rd-locked"><div class="rd-q">?</div><p>${t('no_gift')}</p></div>`;
    return `<div class="rd-fade"><div class="rd-photo" style="transform:rotate(1deg);width:150px;margin:0 auto 8px"><div class="rd-pic" style="height:120px">${I(G.gift, 1.2)}</div><div class="rd-cap">${escapeHtml(g.item)}</div></div>
        <div class="rd-band">${t('circumstances')}<span class="rd-mk"></span></div>
        <p style="font-size:13.5px;line-height:1.6;margin-top:10px"><b>${escapeHtml(g.who || '')}</b><br>${escapeHtml(g.when || '')}<br><br><i>${escapeHtml(g.why || '')}</i></p>
        <div class="rd-acts">${pinBtn('gift', g.id, g.pin)}<button class="rd-btn rpg-d-edit" data-type="gift" data-id="${g.id}">${t('act_edit')}</button>
        <button class="rd-btn rpg-d-del" data-type="gift" data-id="${g.id}">${t('act_del')}</button></div>
        <div class="rd-genstamp" style="margin-top:12px">${I(G.spark)}${t('gift_link')}</div>`;
}

/* ---------- GLOSSARY + NOTES (right page = notes) ---------- */
function glossL() {
    const head = `<div class="rd-eyebrow">${t('world_terms')}</div><div class="rd-htitle">${t('glossary')}</div><div class="rd-rule"></div>`;
    const acts = `<div class="rd-acts"><button class="rd-btn rpg-d-add" data-type="gloss">${t('act_add')}</button></div>`;
    const body = state.glossary.length
        ? `<div class="rd-listcol">${state.glossary.map(g => `<div class="rd-lrow" style="cursor:default;align-items:flex-start">
            <div style="flex:1"><div class="rd-nm" style="color:var(--oxblood)">${escapeHtml(g.term)}</div>
            <div style="font-size:13px;line-height:1.5;margin-top:3px">${escapeHtml(g.def || '')}</div></div>
            <button class="rd-mini rpg-d-edit" data-type="gloss" data-id="${g.id}">✎</button>
            <button class="rd-mini rpg-d-del" data-type="gloss" data-id="${g.id}">✕</button></div>`).join('')}</div>`
        : `<div class="rd-empty">${t('no_gloss')}</div>`;
    return head + body + acts;
}
function notesR() {
    return `<div class="rd-eyebrow">${t('notes_tab')}</div><div class="rd-htitle">${t('notes_tab')}</div><div class="rd-rule"></div>
        <textarea class="rd-note rpg-d-notes" placeholder="${escapeHtml(t('notes_ph'))}">${escapeHtml(state.notes || '')}</textarea>`;
}

/* ---------- EDIT FORMS ---------- */
function field(label, name, val, kind) {
    val = val == null ? '' : val;
    if (kind === 'area') return `<label>${escapeHtml(label)}</label><textarea data-f="${name}">${escapeHtml(val)}</textarea>`;
    if (kind === 'check') return `<label style="display:flex;align-items:center;gap:8px;text-transform:none"><input type="checkbox" data-f="${name}" ${val ? 'checked' : ''}> ${escapeHtml(label)}</label>`;
    return `<label>${escapeHtml(label)}</label><input type="text" data-f="${name}" value="${escapeHtml(val)}">`;
}
function libTitle(s) { return s.title || s.chat || (s.text || '').slice(0, 40); }
function libMeta(s) {
    const d = s.ts ? new Date(s.ts).toLocaleDateString() : '';
    const cur = getContext().name2 || '';
    return `${s.char ? escapeHtml(s.char) + ' · ' : ''}${escapeHtml(d)}${s.char && s.char === cur ? ` · ✓ ${escapeHtml(t('same_char'))}` : ''}`;
}
function libRow(s, kind, checked) {
    const input = kind === 'radio'
        ? `<input type="radio" name="rd-cont" class="rpg-d-cchk" data-id="${s.id}">`
        : `<input type="checkbox" class="rpg-d-mchk" data-id="${s.id}" ${checked ? 'checked' : ''}>`;
    return `<label class="rd-merge-row">${input}
        <span class="rd-mbody">
            <span class="rd-mtitle">${escapeHtml(libTitle(s))}</span>
            <span class="rd-mmeta">${libMeta(s)}</span>
            <span class="rd-mprev">${escapeHtml((s.text || '').slice(0, 120))}…</span>
        </span>
        <span class="rd-macts">
            <button type="button" class="rd-mini rpg-d-libren" data-id="${s.id}" title="${escapeHtml(t('lib_rename'))}">✎</button>
            <button type="button" class="rd-mini rpg-d-libdel" data-id="${s.id}" title="${escapeHtml(t('lib_del'))}">✕</button>
        </span></label>`;
}
function renameLib(id) {
    const lib = settings.summaryLibrary || [];
    const it = lib.find(s => s.id === id); if (!it) return;
    const v = prompt(t('lib_rename'), libTitle(it));
    if (v == null) return;
    it.title = String(v).trim().slice(0, 60);
    saveSettings(); renderPanel();
}
function deleteLib(id) {
    const lib = settings.summaryLibrary || [];
    const it = lib.find(s => s.id === id); if (!it) return;
    if (!confirm(t('lib_del_confirm', { name: libTitle(it) }))) return;   // no accidental wipes
    settings.summaryLibrary = lib.filter(s => s.id !== id);
    saveSettings(); renderPanel();
    toastr.success(t('lib_deleted'));
}
function carrySources() {
    const lib = (Array.isArray(settings.summaryLibrary) ? settings.summaryLibrary : []).map(x => Object.assign({ src: 'lib' }, x));
    const seen = new Set(lib.map(x => x.srcChat).filter(Boolean));
    // any chat that has a diary of its own but never made it into the library (including this one)
    for (const key in (settings.chatStates || {})) {
        if (seen.has(key)) continue;
        const st = settings.chatStates[key];
        if (!st) continue;
        const size = (st.entries || []).length + (st.events || []).length + (st.npcs || []).length + ((st.notes || '').trim() ? 1 : 0);
        if (!size) continue;
        lib.push({
            src: 'chat', id: 'chat:' + key, srcChat: key, ts: (st.meta && st.meta.created) || 0,
            title: (st.author || '') + (st.author ? ' · ' : '') + t('cont_unsummarized'),
            char: st.author || '', chat: key,
            text: (st.summary || '').trim() || t('cont_diary_only', { e: (st.entries || []).length, v: (st.events || []).length, n: (st.npcs || []).length })
        });
    }
    return lib;
}
function continueForm() {
    const lib = carrySources();
    const rows = lib.length ? lib.map(s => libRow(s, 'radio')).join('')
        : `<div class="rd-empty" style="flex:none;padding:14px">${t('no_library')}</div>`;
    return `<div class="rd-htitle">${t('cont_title')}</div><div class="rd-rule"></div>
        <div class="rd-eyebrow" style="margin-bottom:6px">${t('cont_hint')}</div>
        <div class="rd-edit" style="gap:6px">${rows}</div>
        <div class="rd-acts"><button class="rd-btn prim rpg-d-docont">${t('cont_do')}</button><button class="rd-btn rpg-d-cancelf">${t('act_cancel')}</button></div>`;
}
function mergeForm() {
    const lib = carrySources().filter(x => (x.text || '').trim());   // anything with an actual memory text
    const sel = editing.sel || {};
    const rows = lib.length ? lib.map(s => libRow(s, 'check', sel[s.id])).join('')
        : `<div class="rd-empty" style="flex:none;padding:14px">${t('no_library')}</div>`;
    return `<div class="rd-htitle">${t('merge_title')}</div><div class="rd-rule"></div>
        <div class="rd-eyebrow" style="margin-bottom:6px">${t('merge_hint')}</div>
        <div class="rd-edit" style="gap:6px">${rows}
            <label style="margin-top:6px">${t('merge_paste')}</label>
            <textarea class="rpg-d-mpaste" style="min-height:60px"></textarea>
        </div>
        <div class="rd-eyebrow" style="margin-top:6px;color:var(--oxblood)">${t('merge_dest', { chat: escapeHtml(getContext().name2 || '') })}</div>
        <div class="rd-acts"><button class="rd-btn prim rpg-d-domerge">${t('merge_do')}</button><button class="rd-btn rpg-d-cancelf">${t('act_cancel')}</button></div>`;
}
// Rebuild the dossier in THIS chat from a carried snapshot. Uses the same additive merge as
// summarization, so re-applying can only add, never wipe what this chat already knows.
function applyDossierData(d) {
    if (!d || typeof d !== 'object') return;
    if (Array.isArray(d.events)) mergeEvents(d.events.map(e => ({ title: e.title, when: e.when, where: e.where, who: e.who, what: e.what })));
    if (Array.isArray(d.npcs)) mergeNpcs(d.npcs.map(n => ({ name: n.name, role: n.role, look: n.look, how_met: n.met, note: n.note, trust: n.trust })));
    if (Array.isArray(d.locations)) mergeLocations(d.locations.map(l => ({ name: l.name, desc: l.desc })));
    if (Array.isArray(d.gifts)) mergeGifts(d.gifts.map(g => ({ dir: g.dir === '←' ? 'in' : 'out', item: g.item, who: g.who, when: g.when, why: g.why })));
    if (Array.isArray(d.glossary)) mergeGlossary(d.glossary.map(g => ({ term: g.term, def: g.def })));
    if (d.bond && typeof d.bond === 'object' && !state.bond) state.bond = JSON.parse(JSON.stringify(d.bond));
    if (d.notes && String(d.notes).trim()) {                     // personal notes follow the diary
        const cur = (state.notes || '').trim(), inc = String(d.notes).trim();
        if (!cur) state.notes = inc;
        else if (!norm(cur).includes(norm(inc))) state.notes = cur + '\n\n— — —\n' + inc;
    }
    if (settings.carryEntries !== false && Array.isArray(d.entries)) {
        for (const e of d.entries) {
            if (!e || !e.text) continue;
            if (state.entries.some(x => norm(x.text) === norm(e.text))) continue;   // never duplicate
            state.entries.push(Object.assign({}, e, { id: genId(), carried: true }));
        }
        state.entries.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    }
    // keep the pins that were set in the source chat
    if (Array.isArray(d.events)) for (const e of d.events) if (e.pin) { const x = state.events.find(y => norm(y.title) === norm(e.title)); if (x) x.pin = true; }
    if (Array.isArray(d.npcs)) for (const n of d.npcs) if (n.pin) { const x = state.npcs.find(y => norm(y.name) === norm(n.name)); if (x) x.pin = true; }
}
function applyContinue() {
    const root = document.getElementById('rpg-diary-root');
    const pick = root.querySelector('.rpg-d-cchk:checked');
    if (!pick) { toastr.info(t('cont_pick')); return; }
    const item = carrySources().find(s => s.id === pick.dataset.id);
    if (!item) return;
    if (item.src === 'chat') {
        const src = settings.chatStates[item.srcChat];
        if (src && (src.summary || '').trim()) state.summary = String(src.summary).trim();
    }
    if (item.src !== 'chat') state.summary = String(item.text || '').trim();
    if (item.dossier) state.carriedDossier = String(item.dossier);
    state.archiveScenes = (settings.carryScenes && Array.isArray(item.scenes)) ? item.scenes : [];
    applyDossierData(item.data || snapshotFromChat(item.srcChat));   // fall back to the source chat for older memories
    state.summarizedCount = 0; // this chat's own messages haven't been summarized yet
    editing = null;
    saveState(); renderPanel(); buildInjection(); scheduleEmbed();
    const d = item.data || snapshotFromChat(item.srcChat) || {};
    const n = (d.events || []).length, m = (d.npcs || []).length, g = (d.gifts || []).length;
    toastr.success(t('cont_done') + (d.events ? ' ' + t('cont_stats', { e: n, n: m, g }) : ''));
}
function portraitRow(val) {
    return `<label>${t('f_portrait')}</label>
        <div style="display:flex;gap:6px;align-items:center">
            <input type="text" data-f="portrait" value="${escapeHtml(val || '')}" style="flex:1">
            <button class="rd-btn rpg-d-pick" type="button">${t('pick_file')}</button>
        </div>`;
}
function memEditForm() {
    return `<div class="rd-htitle">${t('mem_edit')}</div><div class="rd-rule"></div>
        <div class="rd-eyebrow" style="margin-bottom:6px">${t('mem_edit_hint')}</div>
        <div class="rd-edit"><textarea data-f="summary" style="flex:1;min-height:260px">${escapeHtml(editing.data.summary || '')}</textarea></div>
        <div class="rd-acts"><button class="rd-btn prim rpg-d-savef">${t('act_save')}</button><button class="rd-btn rpg-d-cancelf">${t('act_cancel')}</button></div>`;
}
function editForm() {
    const e = editing; if (!e) return '';
    let rows = '';
    if (e.type === 'entry') {
        const d = e.data;
        rows = field(t('f_date'), 'date', d.date) + field(t('f_loc'), 'loc', d.loc) + field(t('f_weather'), 'weather', d.weather)
            + field(t('f_mood'), 'mood', d.mood) + field(t('f_tags'), 'tags', (d.tags || []).join(', ')) + field(t('f_text'), 'text', d.text, 'area')
            + portraitRow(d.portrait);
    } else if (e.type === 'npc') {
        const d = e.data;
        rows = field(t('f_name'), 'name', d.name) + field(t('f_role'), 'role', d.role) + field(t('f_trust'), 'trust', d.trust)
            + field(t('f_look'), 'look', d.look, 'area') + field(t('f_met'), 'met', d.met, 'area') + field(t('f_note'), 'note', d.note, 'area') + portraitRow(d.portrait);
    } else if (e.type === 'loc') {
        const d = e.data;
        rows = field(t('f_name'), 'name', d.name) + field(t('f_desc'), 'desc', d.desc, 'area') + field(t('f_known'), 'known', d.known !== false, 'check') + portraitRow(d.portrait);
    } else if (e.type === 'gift') {
        const d = e.data;
        rows = `<label>${t('f_dir')}</label><select data-f="dir"><option value="→" ${d.dir !== '←' ? 'selected' : ''}>${escapeHtml(t('dir_out'))}</option><option value="←" ${d.dir === '←' ? 'selected' : ''}>${escapeHtml(t('dir_in'))}</option></select>`
            + field(t('f_item'), 'item', d.item) + field(t('f_who'), 'who', d.who) + field(t('f_when'), 'when', d.when) + field(t('f_why'), 'why', d.why, 'area');
    } else if (e.type === 'evt') {
        const d = e.data;
        rows = field(t('f_title'), 'title', d.title) + field(t('f_when'), 'when', d.when) + field(t('f_where'), 'where', d.where)
            + field(t('f_who2'), 'who', d.who) + field(t('f_what'), 'what', d.what, 'area') + portraitRow(d.portrait);
    } else if (e.type === 'gloss') {
        const d = e.data;
        rows = field(t('f_term'), 'term', d.term) + field(t('f_def'), 'def', d.def, 'area');
    } else if (e.type === 'author') {
        rows = field(t('f_author'), 'author', e.data.author);
    }
    return `<div class="rd-htitle">${e.id ? t('act_edit') : t('act_add')}</div><div class="rd-rule"></div>
        <div class="rd-edit">${rows}</div>
        <div class="rd-acts"><button class="rd-btn prim rpg-d-savef">${t('act_save')}</button><button class="rd-btn rpg-d-cancelf">${t('act_cancel')}</button></div>`;
}

/* ============================================================ RENDER */
function buildL() { return [feedL, memL, bondL, evtListL, npcListL, locGridL, giftsL, glossL][tab](); }
function buildR() { return [() => fullR(state.entries[ei]), memR, bondR, evtR, npcR, locR, giftsR, notesR][tab](); }

function renderPanel() {
    const root = document.getElementById('rpg-diary-root');
    if (!root || !state) return;
    document.getElementById('rd-tabs').innerHTML = TABS.map((tb, i) => `<button class="rd-tab ${tb[2]} ${i === tab ? 'on' : ''}" data-t="${i}">${escapeHtml(t(tb[0]))}</button>`).join('');
    const pageL = document.getElementById('rd-pageL'), pageR = document.getElementById('rd-pageR');
    pageL.innerHTML = buildL();
    pageR.innerHTML = editing ? (editing.type === 'merge' ? mergeForm() : editing.type === 'continue' ? continueForm() : editing.type === 'alerts' ? alertsForm() : editing.type === 'memory' ? memEditForm() : editForm()) : buildR();
    if (aiBusy) pageR.insertAdjacentHTML('beforeend', `<div class="rd-busy">…</div>`);
    wire();
    renderNav();
}
function renderNav() {
    const nav = document.getElementById('rd-nav');
    if (tab !== 0 || !state.entries.length || editing) { nav.innerHTML = ''; return; }
    nav.innerHTML = `<button class="rd-arrow" id="rd-prev"><svg viewBox="0 0 60 26" fill="currentColor"><path d="M2 13l14-9v6h44v6H16v6z"/></svg></button>
        <span class="rd-pagenum">${t('record_n', { i: ei + 1, n: state.entries.length })}</span>
        <button class="rd-arrow" id="rd-next"><svg viewBox="0 0 60 26" fill="currentColor"><path d="M58 13l-14-9v6H0v6h44v6z"/></svg></button>`;
    document.getElementById('rd-prev').onclick = () => turn(-1);
    document.getElementById('rd-next').onclick = () => turn(1);
}
function wire() {
    const root = document.getElementById('rpg-diary-root');
    root.querySelectorAll('.rd-tab').forEach(b => b.onclick = () => { const n = +b.dataset.t; if (tab === n && !editing) return; tab = n; editing = null; renderPanel(); });
    root.querySelectorAll('.rd-frow[data-e]').forEach(el => el.onclick = () => turnTo(+el.dataset.e));
    root.querySelectorAll('.rd-lrow[data-i]').forEach(el => el.onclick = () => {
        const i = +el.dataset.i, id = TAB_IDS[tab];
        if (id === 'bond') bondSel = i; else if (id === 'evt') evtSel = i; else if (id === 'npc') npcSel = i; else if (id === 'gift') giftSel = i;
        renderPanel();
    });
    root.querySelectorAll('.rd-gcell[data-i]').forEach(el => el.onclick = () => { locSel = +el.dataset.i; renderPanel(); });
    const sum = root.querySelector('.rpg-d-sum'); if (sum) sum.onclick = () => summarizeChat(false);
    const rsum = root.querySelector('.rpg-d-resum'); if (rsum) rsum.onclick = () => { if (confirm(t('resum_confirm'))) summarizeChat(true); };
    const chk = root.querySelector('.rpg-d-check'); if (chk) chk.onclick = checkContradictions;
    const wr = root.querySelector('.rpg-d-write'); if (wr) wr.onclick = generateEntry;
    const mg = root.querySelector('.rpg-d-merge'); if (mg) mg.onclick = () => { editing = { type: 'merge', sel: {} }; renderPanel(); };
    const ea = root.querySelector('.rpg-d-editauthor'); if (ea) ea.onclick = () => { editing = { type: 'author', data: { author: (state && state.author) || '' } }; renderPanel(); };
    root.querySelectorAll('.rpg-d-mchk').forEach(ch => ch.onchange = () => { if (!editing.sel) editing.sel = {}; editing.sel[ch.dataset.id] = ch.checked; });
    root.querySelectorAll('.rpg-d-libren').forEach(b => b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); renameLib(b.dataset.id); });
    root.querySelectorAll('.rpg-d-libdel').forEach(b => b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); deleteLib(b.dataset.id); });
    root.querySelectorAll('.rpg-d-verrestore').forEach(b => b.onclick = () => restoreVersion(b.dataset.id));
    const dom = root.querySelector('.rpg-d-domerge'); if (dom) dom.onclick = doMerge;
    const ct = root.querySelector('.rpg-d-continue'); if (ct) ct.onclick = () => { editing = { type: 'continue' }; renderPanel(); };
    const me = root.querySelector('.rpg-d-memedit'); if (me) me.onclick = () => { editing = { type: 'memory', data: { summary: state.summary || '' } }; renderPanel(); };
    const ml = root.querySelector('.rpg-d-memlock'); if (ml) ml.onclick = toggleMemLock;
    const ls = root.querySelector('.rpg-d-libsave');
    if (ls) ls.onclick = () => {
        if (saveToLibrary()) { saveSettings(); renderPanel(); toastr.success(t('mem_tolib_ok')); }
        else toastr.info(t('mem_none'));
    };
    const da = root.querySelector('.rpg-d-draft-apply'); if (da) da.onclick = () => applyDraft('replace');
    const dp = root.querySelector('.rpg-d-draft-append'); if (dp) dp.onclick = () => applyDraft('append');
    const dd = root.querySelector('.rpg-d-draft-drop'); if (dd) dd.onclick = () => applyDraft('drop');
    const dct = root.querySelector('.rpg-d-docont'); if (dct) dct.onclick = applyContinue;
    root.querySelectorAll('.rpg-d-pick').forEach(b => b.onclick = pickPortrait);
    root.querySelectorAll('.rpg-d-add').forEach(b => b.onclick = () => openEditor(b.dataset.type, null));
    root.querySelectorAll('.rpg-d-edit').forEach(b => b.onclick = () => openEditor(b.dataset.type, b.dataset.id));
    root.querySelectorAll('.rpg-d-del').forEach(b => b.onclick = () => delItem(b.dataset.type, b.dataset.id));
    root.querySelectorAll('.rpg-d-pin').forEach(b => b.onclick = () => togglePin(b.dataset.type, b.dataset.id));
    const sv = root.querySelector('.rpg-d-savef'); if (sv) sv.onclick = saveEditor;
    const cn = root.querySelector('.rpg-d-cancelf'); if (cn) cn.onclick = () => { editing = null; renderPanel(); };
    const notes = root.querySelector('.rpg-d-notes'); if (notes) notes.oninput = () => { state.notes = notes.value; saveState(false); };
    const qbox = root.querySelector('.rpg-d-q');
    if (qbox) {
        qbox.oninput = () => { query = qbox.value; renderPanel(); const b = document.querySelector('#rpg-diary-root .rpg-d-q'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } };
    }
}

/* page flip */
let animating = false;
function turnTo(ni) {
    if (animating || tab !== 0 || editing || ni === ei || !state.entries[ni]) { ei = ni; renderPanel(); return; }
    animating = true;
    const pr = document.getElementById('rd-pageR');
    pr.style.transformOrigin = 'left center';
    pr.style.transition = 'transform .26s ease-in';
    pr.style.transform = 'perspective(1300px) rotateY(-90deg)';
    const out = () => {
        pr.removeEventListener('transitionend', out);
        ei = ni;
        pr.innerHTML = fullR(state.entries[ei]);
        document.querySelectorAll('#rd-pageL .rd-frow').forEach((el, k) => el.classList.toggle('sel', k === ei));
        pr.style.transition = 'transform .3s ease-out';
        pr.style.transform = 'perspective(1300px) rotateY(0deg)';
        const inn = () => { pr.removeEventListener('transitionend', inn); pr.style.transition = ''; pr.style.transform = ''; animating = false; wire(); renderNav(); };
        pr.addEventListener('transitionend', inn);
    };
    pr.addEventListener('transitionend', out);
}
function turn(d) { const N = state.entries.length; if (!N) return; turnTo((ei + d + N) % N); }

/* ============================================================ EDIT ACTIONS */
function downscaleImage(src, maxDim, cb) {
    const img = new Image();
    img.onload = () => {
        let w = img.width, h = img.height;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        try { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h); cb(cv.toDataURL('image/jpeg', 0.82)); }
        catch (e) { cb(src); }
    };
    img.onerror = () => cb(src);
    img.src = src;
}
function pickPortrait() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => downscaleImage(r.result, 320, (url) => { const tf = document.querySelector('#rpg-diary-root .rd-edit [data-f="portrait"]'); if (tf) tf.value = url; });
        r.readAsDataURL(f);
    };
    inp.click();
}
function doMerge() {
    const root = document.getElementById('rpg-diary-root');
    const lib = carrySources();
    const sel = editing.sel || {};
    const texts = lib.filter(s => sel[s.id]).map(s => s.text).filter(x => (x || '').trim());
    const pasted = root.querySelector('.rpg-d-mpaste'); if (pasted && pasted.value.trim()) texts.push(pasted.value.trim());
    if (texts.length < 2) { toastr.info(t('t_merge_need2')); return; }
    mergeSummaries(texts);
}
function findItem(type, id) {
    const map = { entry: 'entries', evt: 'events', npc: 'npcs', loc: 'locations', gift: 'gifts', gloss: 'glossary' };
    return (state[map[type]] || []).find(x => x.id === id);
}
function openEditor(type, id) {
    let data;
    if (id) { const it = findItem(type, id); data = it ? Object.assign({}, it) : {}; }
    else {
        if (type === 'entry') { const st = currentStamp(); data = { date: st.label, loc: st.loc, weather: st.weather, mood: '', tags: [], text: '' }; }
        else if (type === 'evt') { const st = currentStamp(); data = { title: '', when: st.label, where: st.loc, who: '', what: '' }; }
        else data = {};
    }
    editing = { type, id: id || null, data };
    renderPanel();
}
function readForm() {
    const root = document.getElementById('rpg-diary-root');
    const o = {};
    root.querySelectorAll('.rd-edit [data-f]').forEach(el => {
        const f = el.dataset.f;
        o[f] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return o;
}
function saveEditor() {
    if (!editing) return;
    if (editing.type === 'memory') { const o = readForm(); state.summary = (o.summary || '').trim(); editing = null; updateCarry(); saveState(); renderPanel(); buildInjection(); toastr.success(t('mem_saved')); return; }
    if (editing.type === 'author') { const o = readForm(); state.author = (o.author || '').trim(); editing = null; saveState(); renderPanel(); buildInjection(); return; }
    const o = readForm(); const type = editing.type;
    const mapArr = { entry: 'entries', evt: 'events', npc: 'npcs', loc: 'locations', gift: 'gifts', gloss: 'glossary' };
    let target = editing.id ? findItem(type, editing.id) : null;
    if (!target) { target = { id: genId(), ts: Date.now() }; state[mapArr[type]].push(target); if (type === 'entry') target.source = 'manual'; }
    if (type === 'entry') {
        target.date = o.date || ''; target.loc = o.loc || ''; target.weather = o.weather || ''; target.mood = o.mood || '';
        target.tags = (o.tags || '').split(',').map(s => s.trim()).filter(Boolean); target.text = o.text || '';
        target.locIcon = locIconFor(o.loc);
        target.portrait = o.portrait || '';
        if (!editing.id) target.source = 'manual';
    } else if (type === 'npc') {
        target.name = o.name || '?'; target.role = o.role || ''; target.look = o.look || ''; target.met = o.met || ''; target.note = o.note || '';
        target.icon = 'user'; target.portrait = o.portrait || ''; if (o.trust !== '' && o.trust != null && !isNaN(parseInt(o.trust))) target.trust = clamp(o.trust, 0, 100);
    } else if (type === 'loc') {
        target.name = o.name || '?'; target.desc = o.desc || ''; target.known = !!o.known; target.icon = locIconFor(o.name); target.portrait = o.portrait || '';
    } else if (type === 'gift') {
        target.dir = o.dir === '←' ? '←' : '→'; target.item = o.item || '?'; target.who = o.who || ''; target.when = o.when || ''; target.why = o.why || '';
    } else if (type === 'evt') {
        target.title = o.title || '?'; target.when = o.when || ''; target.where = o.where || ''; target.who = o.who || ''; target.what = o.what || ''; target.portrait = o.portrait || '';
    } else if (type === 'gloss') {
        target.term = o.term || '?'; target.def = o.def || '';
    }
    editing = null;
    updateCarry();
    saveState(); renderPanel(); buildInjection();
}
function delItem(type, id) {
    const mapArr = { entry: 'entries', evt: 'events', npc: 'npcs', loc: 'locations', gift: 'gifts', gloss: 'glossary' };
    const arr = state[mapArr[type]]; const i = arr.findIndex(x => x.id === id);
    if (i < 0) return;
    arr.splice(i, 1);
    if (type === 'entry' && ei >= arr.length) ei = Math.max(0, arr.length - 1);
    if (type === 'evt' && evtSel >= state.events.length) evtSel = Math.max(0, state.events.length - 1);
    if (type === 'npc' && npcSel >= state.npcs.length) npcSel = Math.max(0, state.npcs.length - 1);
    if (type === 'loc' && locSel >= state.locations.length) locSel = Math.max(0, state.locations.length - 1);
    if (type === 'gift' && giftSel >= state.gifts.length) giftSel = Math.max(0, state.gifts.length - 1);
    editing = null;
    saveState(); renderPanel(); buildInjection();
}

/* ============================================================ MODAL / BUTTON */
function toggleModal() {
    const m = document.getElementById('rpg-diary-modal');
    if (m && m.classList.contains('visible')) closeModal(); else openModal();
}
function ensureButton() {
    // remove the wand-menu entry an earlier version added
    const menuItem = document.getElementById('rpg-diary-menu');
    if (menuItem) menuItem.remove();

    let btn = document.getElementById('rpg-diary-btn');
    if (!btn) {
        btn = document.createElement('div');
        btn.id = 'rpg-diary-btn';
        btn.className = 'rpg-floating-btn';
        btn.innerHTML = '<i class="fa-solid fa-book"></i>';
        document.body.appendChild(btn);
    }
    btn.title = t('btn_open');
    btn.onclick = toggleModal;                       // click again to close
    // Only inside a chat: on SillyTavern's home screen (no chat open) there is nothing to keep a diary for.
    const inChat = !!chatKey();
    btn.style.display = (settings.enabled && inChat) ? 'flex' : 'none';
}

function ensureModal() {
    if (document.getElementById('rpg-diary-modal')) return;
    const m = document.createElement('div');
    m.id = 'rpg-diary-modal';
    m.innerHTML = `<div id="rpg-diary-drag"><span class="rd-grip">⠿</span><span class="rd-dtitle">${escapeHtml(t('cover_title'))}</span><span class="rd-x" title="${escapeHtml(t('close'))}">✕</span></div>
    <div id="rpg-diary-root"><div class="rd-fit"><div class="rd-book closed" id="rd-book">
        <div class="rd-cover"><div class="rd-spread">
            <div class="rd-page left"><div class="rd-pad" id="rd-pageL"></div></div>
            <div class="rd-page right"><div class="rd-pad" id="rd-pageR"></div></div>
            <div class="rd-spine"></div>
        </div>
        <div class="rd-tabs" id="rd-tabs"></div>
        <div class="rd-nav" id="rd-nav"></div>
        </div>
        <div class="rd-front" id="rd-front">
            <span class="rd-fc-corner tl"></span><span class="rd-fc-corner tr"></span><span class="rd-fc-corner bl"></span><span class="rd-fc-corner br"></span>
            <div class="rd-fc-ribbon"></div>
            <div class="rd-fc-emblem">${I(G.book, 1.4)}</div>
            <div class="rd-fc-title">${escapeHtml(t('cover_title'))}</div>
            <div class="rd-fc-sub">${escapeHtml(t('cover_sub'))}</div>
            <div class="rd-fc-strap"><span class="rd-buckle"></span></div>
            <div class="rd-fc-hint">${escapeHtml(t('cover_hint'))}</div>
        </div>
    </div></div></div>`;
    document.body.appendChild(m);
    const handle = document.getElementById('rpg-diary-drag');
    handle.querySelector('.rd-x').onclick = (e) => { e.stopPropagation(); closeModal(); };
    makeModalDraggable(m, handle);
    document.getElementById('rd-front').onclick = () => {
        const bk = document.getElementById('rd-book'); bk.classList.remove('closed'); bk.classList.add('open'); bookOpen = true;
    };
    fitBook();
    window.addEventListener('resize', () => { if (document.getElementById('rpg-diary-modal').classList.contains('visible')) fitBook(); });
}
function makeModalDraggable(win, handle) {
    if (!win || !handle) return;
    handle.style.touchAction = 'none';
    handle.onpointerdown = (e) => {
        if (e.target.closest('.rd-x')) return;
        e.preventDefault();
        const r = win.getBoundingClientRect();
        win.style.transform = 'none'; win.style.left = r.left + 'px'; win.style.top = r.top + 'px';
        let sx = e.clientX, sy = e.clientY;
        try { handle.setPointerCapture(e.pointerId); } catch (_) { }
        handle.onpointermove = (ev) => {
            const dx = ev.clientX - sx, dy = ev.clientY - sy; sx = ev.clientX; sy = ev.clientY;
            win.style.left = (win.offsetLeft + dx) + 'px'; win.style.top = (win.offsetTop + dy) + 'px';
        };
        handle.onpointerup = () => { handle.onpointermove = null; handle.onpointerup = null; try { handle.releasePointerCapture(e.pointerId); } catch (_) { } };
    };
}
function fitBook() {
    const book = document.getElementById('rd-book'); if (!book) return;
    const avail = Math.min(window.innerWidth - 40, 780);
    const s = Math.min(1, avail / 742);
    book.style.transform = `scale(${s})`;
}
function openModal() {
    loadState(); ensureModal();
    const bk = document.getElementById('rd-book');
    if (bk) { if (bookOpen) { bk.classList.remove('closed'); bk.classList.add('open'); } else { bk.classList.add('closed'); bk.classList.remove('open'); } }
    renderPanel(); fitBook();
    const m = document.getElementById('rpg-diary-modal');
    m.classList.add('visible');
    const r = m.getBoundingClientRect();
    if (r.width && (r.right < 60 || r.left > window.innerWidth - 60 || r.bottom < 40 || r.top > window.innerHeight - 40)) { m.style.left = ''; m.style.top = ''; m.style.transform = ''; }
    scheduleEmbed();
}
function closeModal() {
    const m = document.getElementById('rpg-diary-modal'); if (m) m.classList.remove('visible');
    editing = null;
}

/* ============================================================ IMPORT / EXPORT */
function exportDiary() {
    if (!state) return;
    const payload = { _type: 'rpg-diary', version: 2, exported: new Date().toISOString(), chatName: getContext().name2 || '', diary: state, library: settings.summaryLibrary || [] };
    try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = 'diary-' + String(chatKey() || 'chat').replace(/[^\w.-]/g, '_') + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e) { toastr.error('Export failed'); }
}
function exportAll() {
    const payload = { _type: 'rpg-diary-all', version: 2, exported: new Date().toISOString(), chatStates: settings.chatStates || {}, library: settings.summaryLibrary || [] };
    try {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'diary-ALL-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e) { toastr.error('Export failed'); }
}
function importAll() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            let obj; try { obj = JSON.parse(r.result); } catch (e) { toastr.error(t('t_import_bad')); return; }
            if (!obj || !obj.chatStates || typeof obj.chatStates !== 'object') { toastr.error(t('t_import_bad')); return; }
            const n = Object.keys(obj.chatStates).length;
            if (!confirm(t('t_importall_confirm', { n }))) return;
            settings.chatStates = Object.assign({}, settings.chatStates, obj.chatStates);   // merge, never wipe
            if (Array.isArray(obj.library)) {
                if (!Array.isArray(settings.summaryLibrary)) settings.summaryLibrary = [];
                for (const it of obj.library) if (it && it.text && !settings.summaryLibrary.some(x => x.text === it.text)) settings.summaryLibrary.push(it);
                settings.summaryLibrary = settings.summaryLibrary.slice(0, 60);
            }
            loadState(); vecCache.clear(); lastQueryVec = null;
            saveState(); buildInjection();
            if (document.getElementById('rpg-diary-modal')) renderPanel();
            toastr.success(t('t_importall_done', { n }));
        };
        r.readAsText(f);
    };
    inp.click();
}
function importDiary() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
        const f = inp.files && inp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            let obj; try { obj = JSON.parse(r.result); } catch (e) { toastr.error(t('t_import_bad')); return; }
            const d = obj && (obj.diary || obj);
            if (!d || typeof d !== 'object' || !Array.isArray(d.entries)) { toastr.error(t('t_import_bad')); return; }
            if (!confirm(t('t_import_confirm'))) return;
            const fresh = freshState();
            for (const k in fresh) if (k in d) fresh[k] = d[k];
            for (const arr of ['entries', 'events', 'npcs', 'locations', 'gifts', 'glossary', 'summaries']) if (!Array.isArray(fresh[arr])) fresh[arr] = [];
            state = fresh;
            const chatId = chatKey(); if (chatId) settings.chatStates[chatId] = state;
            if (Array.isArray(obj.library)) {
                if (!Array.isArray(settings.summaryLibrary)) settings.summaryLibrary = [];
                for (const it of obj.library) if (it && it.text && !settings.summaryLibrary.some(x => x.text === it.text)) settings.summaryLibrary.push(it);
                settings.summaryLibrary = settings.summaryLibrary.slice(0, 40);
            }
            vecCache.clear(); lastQueryVec = null;
            ei = 0; evtSel = 0; npcSel = 0; locSel = 0; giftSel = 0; editing = null;
            saveState(); buildInjection(); scheduleEmbed();
            if (document.getElementById('rpg-diary-modal')) renderPanel();
            toastr.success(t('t_import_done'));
        };
        r.readAsText(f);
    };
    inp.click();
}

/* ============================================================ SETTINGS UI */
function settingsHtml() {
    const opt = (v, cur, label) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    return `<div class="rpg-diary-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header"><b>${escapeHtml(t('set_title'))}</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
            <div class="inline-drawer-content">
                <label class="checkbox_label"><input type="checkbox" id="rpgd-enable"> ${escapeHtml(t('set_enable'))}</label>
                <div class="rd-set-row"><label>${escapeHtml(t('set_lang'))}</label>
                    <select id="rpgd-lang" class="text_pole widthNatural">${opt('en', settings.language, 'English')}${opt('ru', settings.language, 'Русский')}</select>
                    <label style="margin-left:10px">${escapeHtml(t('set_output_lang'))}</label>
                    <select id="rpgd-outlang" class="text_pole widthNatural">${opt('follow', settings.outputLang, t('lang_follow'))}${opt('en', settings.outputLang, t('lang_en'))}${opt('ru', settings.outputLang, t('lang_ru'))}</select>
                </div>
                <div class="rd-set-row"><button id="rpgd-export" class="menu_button">⤓ ${escapeHtml(t('export_btn'))}</button><button id="rpgd-import" class="menu_button">⤒ ${escapeHtml(t('import_btn'))}</button></div>
                <div class="rd-set-row"><button id="rpgd-exportall" class="menu_button">⤓⤓ ${escapeHtml(t('exportall_btn'))}</button><button id="rpgd-importall" class="menu_button">⤒⤒ ${escapeHtml(t('importall_btn'))}</button></div>
                <hr><b>${escapeHtml(t('set_api'))}</b>
                <div class="rd-set-row"><label style="min-width:70px">${escapeHtml(t('set_url'))}</label><input id="rpgd-url" class="text_pole" style="flex:1" type="text"></div>
                <div class="rd-set-row"><label style="min-width:70px">${escapeHtml(t('set_key'))}</label><input id="rpgd-key" class="text_pole" style="flex:1" type="password"></div>
                <div class="rd-set-row"><label style="min-width:70px">${escapeHtml(t('set_model'))}</label><input id="rpgd-model" class="text_pole" style="flex:1" type="text"></div>
                <div class="rd-set-row"><label style="min-width:70px">${escapeHtml(t('set_temp'))}</label><input id="rpgd-temp" class="text_pole" style="width:70px" type="number" min="0" max="2" step="0.1">
                    <label>${escapeHtml(t('set_maxtok'))}</label><input id="rpgd-maxtok" class="text_pole" style="width:90px" type="number" min="1000" max="64000" step="1000"></div>
                <div class="rd-set-row" style="font-size:11px;opacity:.75">${escapeHtml(t('set_maxtok_note'))}</div>
                <hr><b>${escapeHtml(t('set_inject_h'))}</b>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-injmemory"> ${escapeHtml(t('set_injmemory'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-injsummary"> ${escapeHtml(t('set_injsummary'))}</label>
                <div class="rd-set-row" style="font-size:11px;opacity:.75">${escapeHtml(t('set_injmemory_note'))}</div>
                <div class="rd-set-row"><label>${escapeHtml(t('set_injmode'))}</label>
                    <select id="rpgd-injmode" class="text_pole widthNatural">${opt('depth', settings.injectMode, t('inj_depth'))}${opt('top', settings.injectMode, t('inj_top'))}${opt('both', settings.injectMode, t('inj_both'))}</select></div>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-injnew"> ${escapeHtml(t('set_injnew'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-injdiary"> ${escapeHtml(t('set_injdiary'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-injfull"> ${escapeHtml(t('set_injfull'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-ragtoggle"> ${escapeHtml(t('set_ragtoggle'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-notesai"> ${escapeHtml(t('set_notes_ai'))}</label>
                <div class="rd-set-row"><label>${escapeHtml(t('set_injdepth'))}</label><input id="rpgd-injdepth" class="text_pole" style="width:60px" type="number" min="0" max="20">
                    <label>${escapeHtml(t('set_injentries'))}</label><input id="rpgd-injentries" class="text_pole" style="width:60px" type="number" min="0" max="12">
                    <label>${escapeHtml(t('set_injbudget'))}</label><input id="rpgd-injbudget" class="text_pole" style="width:80px" type="number" min="200" max="6000"></div>
                <hr><b>${escapeHtml(t('set_memory_h'))}</b>
                <div class="rd-set-row"><label>${escapeHtml(t('set_carrymode'))}</label>
                    <select id="rpgd-carrymode" class="text_pole widthNatural">${opt('off', settings.carryMode, t('carry_off'))}${opt('char', settings.carryMode, t('carry_char'))}${opt('all', settings.carryMode, t('carry_all'))}</select></div>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-carrydossier"> ${escapeHtml(t('set_carrydossier'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-carryentries"> ${escapeHtml(t('set_carryentries'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-carryscenes"> ${escapeHtml(t('set_carryscenes'))}</label>
                <div class="rd-set-row" style="font-size:11px;opacity:.75">${escapeHtml(t('set_carryscenes_note'))}</div>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-ragdossiers"> ${escapeHtml(t('set_ragdossiers'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-incremental"> ${escapeHtml(t('set_incremental'))}</label>
                <hr><b>${escapeHtml(t('set_auto_h'))}</b>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-autosum"> ${escapeHtml(t('set_autosum'))}</label>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-autoentry"> ${escapeHtml(t('set_autoentry'))}</label>
                <div class="rd-set-row"><label>${escapeHtml(t('set_autodays'))}</label><input id="rpgd-autodays" class="text_pole" style="width:60px" type="number" min="1" max="30"></div>
                <div class="rd-set-row"><label>${escapeHtml(t('set_autoevery'))}</label><input id="rpgd-autoevery" class="text_pole" style="width:60px" type="number" min="0" max="200"></div>
                <div class="rd-set-row" style="font-size:11px;opacity:.75">${escapeHtml(t('set_autoevery_note'))}</div>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-locknew"> ${escapeHtml(t('set_locknew'))}</label>
                <div class="rd-set-row"><label>${escapeHtml(t('set_librarymode'))}</label>
                    <select id="rpgd-librarymode" class="text_pole widthNatural">${opt('update', settings.libraryMode, t('lib_update'))}${opt('append', settings.libraryMode, t('lib_append'))}</select></div>
                <hr><b>${escapeHtml(t('set_embed_h'))}</b>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-useembed"> ${escapeHtml(t('set_useembed'))}</label>
                <div class="rd-set-row"><label style="min-width:70px">${escapeHtml(t('set_url'))}</label><input id="rpgd-emburl" class="text_pole" style="flex:1" type="text" placeholder="${escapeHtml(t('set_embed_url_ph'))}"></div>
                <div class="rd-set-row"><label style="min-width:70px">${escapeHtml(t('set_key'))}</label><input id="rpgd-embkey" class="text_pole" style="flex:1" type="password" placeholder="${escapeHtml(t('set_embed_url_ph'))}"></div>
                <div class="rd-set-row"><label style="min-width:70px">${escapeHtml(t('set_model'))}</label><input id="rpgd-embmodel" class="text_pole" style="flex:1" type="text"></div>
                <div class="rd-set-row"><button id="rpgd-embtest" class="menu_button">${escapeHtml(t('embed_test'))}</button></div>
                <div class="rd-set-row" style="font-size:11px;opacity:.75">${escapeHtml(t('set_embed_note'))}</div>
                <hr><b>${escapeHtml(t('set_scene_h'))}</b>
                <label class="checkbox_label"><input type="checkbox" id="rpgd-scenesearch"> ${escapeHtml(t('set_scenesearch'))}</label>
                <div class="rd-set-row"><label>${escapeHtml(t('set_scenemax'))}</label><input id="rpgd-scenemax" class="text_pole" style="width:60px" type="number" min="0" max="5">
                    <label>${escapeHtml(t('set_sceneskip'))}</label><input id="rpgd-sceneskip" class="text_pole" style="width:60px" type="number" min="0" max="200"></div>
            </div>
        </div>
    </div>`;
}
function bindSettings() {
    const $ = (id) => document.getElementById(id);
    const set = (id, key, kind) => {
        const el = $(id); if (!el) return;
        if (kind === 'check') { el.checked = !!settings[key]; el.onchange = () => { settings[key] = el.checked; saveSettings(); postSettingChange(); }; }
        else if (kind === 'num') { el.value = settings[key]; el.onchange = () => { settings[key] = parseFloat(el.value); saveSettings(); postSettingChange(); }; }
        else if (kind === 'int') { el.value = settings[key]; el.onchange = () => { settings[key] = parseInt(el.value) || 0; saveSettings(); postSettingChange(); }; }
        else { el.value = settings[key] || ''; el.onchange = () => { settings[key] = el.value; saveSettings(); postSettingChange(); }; }
    };
    set('rpgd-enable', 'enabled', 'check');
    const exBtn = document.getElementById('rpgd-export'); if (exBtn) exBtn.onclick = exportDiary;
    const imBtn = document.getElementById('rpgd-import'); if (imBtn) imBtn.onclick = importDiary;
    const exAll = document.getElementById('rpgd-exportall'); if (exAll) exAll.onclick = exportAll;
    const imAll = document.getElementById('rpgd-importall'); if (imAll) imAll.onclick = importAll;
    set('rpgd-lang', 'language', 'str'); set('rpgd-outlang', 'outputLang', 'str');
    set('rpgd-url', 'baseUrl', 'str'); set('rpgd-key', 'apiKey', 'str'); set('rpgd-model', 'model', 'str'); set('rpgd-temp', 'temperature', 'num'); set('rpgd-maxtok', 'maxTokens', 'int');
    set('rpgd-injmemory', 'injectMemory', 'check'); set('rpgd-injsummary', 'injectSummary', 'check');
    set('rpgd-injmode', 'injectMode', 'str');
    set('rpgd-injnew', 'injectOnNew', 'check'); set('rpgd-injdiary', 'injectDiary', 'check'); set('rpgd-injfull', 'injectWhenFull', 'check');
    set('rpgd-ragtoggle', 'ragToggle', 'check'); set('rpgd-notesai', 'notesToAI', 'check');
    set('rpgd-injdepth', 'injectDepth', 'int'); set('rpgd-injentries', 'injectEntries', 'int'); set('rpgd-injbudget', 'injectBudget', 'int');
    set('rpgd-autoentry', 'autoEntry', 'check'); set('rpgd-autodays', 'autoEntryDays', 'int');
    set('rpgd-autosum', 'autoSummarize', 'check'); set('rpgd-autoevery', 'autoEvery', 'int'); set('rpgd-librarymode', 'libraryMode', 'str'); set('rpgd-locknew', 'lockNewMemory', 'check');
    set('rpgd-carrymode', 'carryMode', 'str'); set('rpgd-carrydossier', 'carryDossier', 'check'); set('rpgd-carryscenes', 'carryScenes', 'check'); set('rpgd-carryentries', 'carryEntries', 'check');
    set('rpgd-ragdossiers', 'ragDossiers', 'check'); set('rpgd-incremental', 'incremental', 'check');
    const et = document.getElementById('rpgd-embtest'); if (et) et.onclick = testEmbeddings;
    set('rpgd-scenesearch', 'sceneSearch', 'check'); set('rpgd-scenemax', 'sceneMax', 'int'); set('rpgd-sceneskip', 'sceneSkipTail', 'int');
    set('rpgd-useembed', 'useEmbeddings', 'check'); set('rpgd-emburl', 'embedUrl', 'str'); set('rpgd-embkey', 'embedKey', 'str'); set('rpgd-embmodel', 'embedModel', 'str');
}
function postSettingChange() {
    ensureButton();
    buildInjection();
    scheduleEmbed();
}

/* ============================================================ EVENTS + INIT */
function onChatChanged() {
    loadState();
    ensureButton();          // hide it again if we've dropped back to the home screen
    ei = 0; bondSel = 0; evtSel = 0; npcSel = 0; locSel = 0; giftSel = 0; editing = null;
    lastQueryVec = null;
    buildInjection();
    scheduleEmbed();
    if (document.getElementById('rpg-diary-modal') && document.getElementById('rpg-diary-modal').classList.contains('visible')) renderPanel();
}
function onMessage(id) {
    if (!settings.enabled || !state) return;
    buildInjection();
    scheduleEmbed();
    if (!settings.apiKey || aiBusy) return;
    // Message-count trigger: keeps the memory topped up even without a Scene Card / game calendar.
    const every = Math.max(0, parseInt(settings.autoEvery) || 0);
    if (every > 0) {
        const total = buildTranscript().length;
        const behind = total - (state.summarizedCount || 0);
        if (behind >= every) { summarizeChat(); return; }   // incremental: only the new messages
    }
    // Game-day rollover: fires on the first message of a NEW in-game day (from the Scene Card).
    // A time-skip that jumps several days still fires exactly once — we compare against the last
    // day we acted on, so no burst of summaries, and never mid-day.
    const st = currentStamp();
    if (st.day == null) return;                       // no Scene Card day → skip auto-runs entirely
    if (state.lastSummaryDay == null) { state.lastSummaryDay = st.day; saveState(false); return; }
    if (st.day <= state.lastSummaryDay) return;       // same day (or clock went back) → nothing to do
    const gap = Math.max(1, settings.autoEntryDays || 1);
    if (st.day - state.lastSummaryDay < gap) return;  // not enough game-days passed yet
    state.lastSummaryDay = st.day;
    saveState(false);
    if (settings.autoSummarize) summarizeChat();      // incremental: only the new messages
    else if (settings.autoEntry) generateEntry();
}

jQuery(() => {
    loadSettings();
    const holder = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (holder) { const wrap = document.createElement('div'); wrap.innerHTML = settingsHtml(); holder.appendChild(wrap); bindSettings(); }
    ensureButton();
    if (chatKey()) { loadState(); buildInjection(); }

    eventSource.on(event_types.CHAT_CHANGED, () => setTimeout(onChatChanged, 120));
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessage);
});

/* ============================================================ CROSS-EXTENSION BRIDGE */
window.RPG = window.RPG || {};
window.RPG.diary = {
    available: true,
    isEnabled: () => !!settings.enabled,
    addEntry: (e) => {
        if (!state) return null;
        const st = currentStamp();
        const item = {
            id: genId(), ts: Date.now(), date: e && e.date || st.label, loc: e && e.loc || st.loc, weather: e && e.weather || st.weather,
            locIcon: locIconFor(e && e.loc || st.loc), mood: e && e.mood || '', tags: (e && Array.isArray(e.tags)) ? e.tags.map(String) : [],
            text: String(e && e.text || ''), source: (e && e.source) || 'manual'
        };
        state.entries.push(item); saveState(); buildInjection(); return item.id;
    },
    addEvent: (e) => { if (!state) return; mergeEvents([e]); updateCarry(); saveState(); buildInjection(); },
    addNpc: (n) => { if (!state) return; mergeNpcs([n]); saveState(); buildInjection(); },
    addGift: (g) => { if (!state) return; mergeGifts([g]); saveState(); buildInjection(); },
    addLocation: (l) => { if (!state) return; mergeLocations([l]); saveState(); buildInjection(); },
    revealLocation: (name) => { if (!state) return; const l = state.locations.find(x => x.name.toLowerCase() === String(name).toLowerCase()); if (l) { l.known = true; saveState(); buildInjection(); } },
    getSummary: () => state ? (state.summary || '') : '',
    summarizeNow: () => summarizeChat(),
    refresh: () => { loadState(); buildInjection(); }
};

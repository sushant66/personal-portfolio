---
title: "Why I didn't write our own sync protocol"
description: "Our browser panel renders from a local replica, so every Postgres write has to travel to it. The from-scratch design had rev counters, tombstones and an epoch column. Why we bought the sync layer instead, why Zero over ElectricSQL, and the two places buying it still bit us."
date: 2026-08-08
tags: [postgres, cdc, sync, zero, architecture, decisions]
---

# Why I didn't write our own sync protocol

Our product ships a Chrome extension panel that renders from a local replica in the browser, not from an API call per screen. The data behind it lives in Postgres, and it gets written from several places: an API request when a user does something, a background worker when an enrichment job finishes, a migration during a deploy, occasionally me in `psql`. All of those writes have to end up on screen.

Two constraints made it interesting. A change has to land within seconds while the panel is open, and the panel has to be correct after being closed for three days. Extensions are unreachable most of the time: the service worker gets suspended, the tab gets closed, the browser gets quit. So you can't push at the moment data changes and call it done, and you can't refetch everything on open either, because the full per-user dataset runs to tens of megabytes.

## The version I designed first

I wrote the design doc for building it ourselves, and there was nothing wrong with it. It looked like this:

- a `rev` sequence on every row, so a client could ask for "everything after 41,206"
- a change log table, because you cannot derive a delta from current state alone
- tombstones, so a client that missed a delete eventually learns about it, plus a retention window and a purge job
- an `epoch` column, so that when I inevitably shipped a bad projection I could force every client to resync
- a `/sync/changes` endpoint with a cursor, paging, and idempotency
- a `pg_notify` channel and a `LISTEN` task bridging into our existing WebSocket to poke clients awake
- a hand-written IndexedDB schema on the client with its own cursor bookkeeping, running inside an MV3 service worker that can be killed at any point, including halfway through first hydration

None of that is exotic, and that is what eventually bothered me. I could name the standard solution for every piece, which meant the code I was about to write was a re-implementation, with fresh bugs in it, of a problem other people had already spent years fixing the edge cases of. And these are the nasty kind of bug. An off-by-one in cursor handling doesn't crash anything. It quietly leaves one client three rows behind for a week.

The unlock was obvious in retrospect: Postgres already keeps a change log. It's the WAL, it's ordered, it's durable, and logical replication is a supported way to read it. Commit order already *is* the total order I was trying to manufacture with a sequence column.

Once the question turned into "what reads the WAL for me", the shortlist was short. ElectricSQL, PowerSync, Zero.

## Zero over Electric, and it wasn't a landslide

Electric was the runner-up and it was genuinely close. It's more mature (GA since March 2025, against Zero's 1.0 in June 2026) and it has the smallest protocol surface of the three, a resumable HTTP shape log. On paper it was the lower-risk pick, and I expected to choose it.

It lost on one thing. Electric is a sync *stream*, not a store. It hands you an ordered feed of changes and you decide where to put them. In a normal web app that's a mild inconvenience. In a Chrome extension it's the hardest part of the entire job, because the ready-made persistence option is wa-sqlite over OPFS, which is fiddly in extension contexts, and the alternative is roughly the 200 lines of hand-rolled IndexedDB I was specifically trying not to write. Picking Electric meant deleting most of my sync code and keeping the one piece that lives in the worst environment.

Zero ships the store, the persistence, and the reactivity as one tested unit. Its client library *is* the local replica. You subscribe to a query and it re-emits when replicated rows change; on open it catches up from whatever it had persisted rather than refetching.

So I chose the less proven tool on purpose, which needs some defending. Three things made it defensible. We only use the read path, so we never touch custom mutators or optimistic writes, the most complex part of that engine. I put four validation gates in front of any build-out and wrote down that failing any one of them meant falling back to Electric; the two that mattered most were preloading a realistic dataset then killing and reopening the surface repeatedly to prove it resumes from persisted state instead of refetching, and `kill -9` on the sync service under write load. And the fallback was cheap, because the backend is identical under either engine. Electric reads the same WAL off the same tables.

The gates passed. The WAL to service to per-user reactive stream part worked on the first attempt once our query endpoint returned a valid AST, which was not what I'd braced for from the youngest tool in the evaluation.

## Buying didn't remove the work, it moved it

This is the part I got wrong. Twice.

Any change-propagation problem has two halves: **capture**, noticing that data changed, and **apply**, turning it into the shape the client renders. "CDC" as a term only names the capture half. Buying Zero deleted capture and delivery outright, the entire bullet list above, and did nothing at all for apply. Our panel doesn't render normalized tables. It renders denormalized rows with the account name stamped on every meeting and precomputed fields sitting alongside. Something has to build that shape, and that something was always going to be ours.

<figure>
<svg viewBox="0 0 640 486" role="img" aria-label="Flow diagram: writers to source tables, to projection tables via a trigger in the same transaction, to the sync service via logical replication, to the local replica in the extension over a WebSocket, to a live query and UI re-render." style="font-family: var(--font-sans)">
  <defs>
    <marker id="sync-arw" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L8 4 L0 8 z" fill="var(--line-strong)" />
    </marker>
    <marker id="sync-arw-a" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L8 4 L0 8 z" fill="var(--signal)" />
    </marker>
  </defs>

  <rect x="16" y="4" width="608" height="34" rx="4" fill="none" stroke="var(--line-strong)" stroke-dasharray="3 3" />
  <text x="320" y="26" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">any writer: API request · background worker · migration · psql</text>
  <line x1="320" y1="38" x2="320" y2="60" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#sync-arw)" />

  <rect x="16" y="66" width="608" height="52" rx="6" fill="var(--surface)" stroke="var(--line-strong)" />
  <text x="320" y="88" text-anchor="middle" font-size="14.5" font-weight="600" fill="var(--ink)">source tables</text>
  <text x="320" y="105" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">normalized, the shape the rest of the backend wants</text>
  <line x1="320" y1="118" x2="320" y2="160" stroke="var(--signal)" stroke-width="1.5" marker-end="url(#sync-arw-a)" />
  <text x="332" y="143" font-size="12" fill="var(--signal-text)" style="font-family: var(--font-mono)">trigger, same transaction</text>

  <rect x="16" y="166" width="608" height="56" rx="6" fill="var(--signal-tint)" stroke="var(--signal)" />
  <text x="320" y="189" text-anchor="middle" font-size="14.5" font-weight="600" fill="var(--ink)">projection tables</text>
  <text x="320" y="206" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">one per store · typed columns · plain current state, no sync bookkeeping</text>
  <line x1="320" y1="222" x2="320" y2="264" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#sync-arw)" />
  <text x="332" y="247" font-size="12" fill="var(--ink-3)" style="font-family: var(--font-mono)">WAL · logical replication</text>

  <rect x="16" y="270" width="608" height="52" rx="6" fill="var(--surface)" stroke="var(--line-strong)" />
  <text x="320" y="292" text-anchor="middle" font-size="14.5" font-weight="600" fill="var(--ink)">sync service beside Postgres</text>
  <text x="320" y="309" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">tails the WAL, keeps its own replica, filters to one user's rows</text>
  <line x1="320" y1="322" x2="320" y2="364" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#sync-arw)" />
  <text x="332" y="347" font-size="12" fill="var(--ink-3)" style="font-family: var(--font-mono)">WebSocket · JWT authorised</text>

  <rect x="16" y="370" width="608" height="52" rx="6" fill="var(--surface)" stroke="var(--line-strong)" />
  <text x="320" y="392" text-anchor="middle" font-size="14.5" font-weight="600" fill="var(--ink)">local replica in the extension</text>
  <text x="320" y="409" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">persisted, resumes from where it left off</text>
  <line x1="320" y1="422" x2="320" y2="444" stroke="var(--line-strong)" stroke-width="1.5" marker-end="url(#sync-arw)" />

  <rect x="16" y="450" width="608" height="34" rx="4" fill="none" stroke="var(--line-strong)" stroke-dasharray="3 3" />
  <text x="320" y="472" text-anchor="middle" font-size="12.5" fill="var(--ink-2)">live query re-emits, the view re-renders</text>
</svg>
<figcaption>The highlighted hop is the only sync code we wrote. Everything from the WAL down is the dependency.</figcaption>
</figure>

My first design for the projection was a single table. Primary key of (user, store, id), a JSONB payload column, one migration covering all six stores. Very tidy. It survived until I tried to filter meetings by their link status and learned that Zero's AST addresses flat column names. No JSON paths, no column projection. Everything inside that payload is opaque to the query layer, so any filtering or ordering has to happen in JavaScript after syncing the whole store anyway. That table was elegant because it had hidden all the structure the query layer needed to see. It became six typed tables, one per store, and a nested field now earns filterability by being promoted to a real column.

The second thing I got wrong was where the projection ran. I built it as a Python service the API called after writing. That's a dual write, and the tell is the writer list from the top of this post: the API, background workers, migrations, seed scripts, me in `psql`. A projector that has to be *called* stays correct exactly as long as every writer remembers to call it, and the first forgotten call produces no error anywhere. It produces a stale panel that surfaces days later as a support question.

So the projection moved into the database, as `AFTER INSERT/UPDATE/DELETE` triggers that build the row and upsert it in the same transaction as the source write. A migration is now covered identically to an API request, and so am I with my `psql` session. That is the actual argument for triggers here, not performance.

Writing them made concrete something I'd been hand-waving: the unit of change is frequently not the row that changed. A note has no row of its own in the projection. It contributes to its meeting's attachments list. So a note write has to re-project its parent meeting, and an update that moves a note between meetings has to fix up both sides:

```sql
IF TG_OP <> 'INSERT' AND OLD.meeting_id IS NOT NULL THEN
    PERFORM project_meeting(OLD.meeting_id);
END IF;

IF TG_OP <> 'DELETE' AND NEW.meeting_id IS NOT NULL THEN
    -- Skip the redundant second call when the note did not change meetings.
    IF TG_OP = 'INSERT' OR NEW.meeting_id IS DISTINCT FROM OLD.meeting_id THEN
        PERFORM project_meeting(NEW.meeting_id);
    END IF;
END IF;
```

That lookup is also why raw row-level WAL events wouldn't have saved me any work. Whatever mechanism captures the change, something still has to know that a note means a meeting.

The bill for triggers, stated plainly: a projection bug now fails the business write. There's no exception handler, so if the trigger throws, the source `INSERT` aborts with it. That's a worse blast radius than an async projector and it was chosen deliberately, because a projection that throws gets found in minutes and one that hides gets found by a customer.

## The parts of buying that weren't free

Two of these cost me real hours, and both failed silently, which I now think is the actual signature of leaning on a young dependency. Not crashes. Crashes are easy.

The publication environment variable is plural. The underlying config option is an array that defaults to empty, so a misspelled singular name isn't a startup error, it's ignored, and the service falls back to auto-creating a replicate-everything publication. I measured it: with the singular name, 25 tables were replicated into its replica, including email bodies and contacts. With the plural name, 10. (Ten and not the seven projection tables, because it also replicates three bookkeeping tables of its own. I spent a while trying to "fix" that number downward before working out it was already correct.) Nothing in the logs announces that you are now replicating your PII into a second store. You have to know to go looking for the absence of the fallback publication name.

The other one: the AST our endpoint returns has to carry the Postgres table names, not the client-facing ones. The service only name-maps an AST it built itself, and Zero's own reference endpoint maps client names to server names before responding. Get it backwards and the query resolves to nothing at all, with no error on either side. Both of these now have tests whose entire job is to fail loudly on a version bump.

There's also an operational risk we now own permanently, and it's the one I'd flag hardest to anyone at this fork. A logical replication slot that stops being consumed makes Postgres retain WAL for it, and the primary's disk grows. If the sync service is wedged or down for long enough, that is a production incident on your database, caused by a component that is not your database. It needs a retained-WAL alert and a hard cap on slot retention, and neither is optional.

## What I'd tell someone at the same fork

The framing I started with was build versus buy, and it was the wrong question. I wasn't deciding whether to write code. I was deciding which half of the problem was mine, and buying let me keep the half where the domain knowledge lived and hand off the half where I'd only have been re-deriving well-understood answers. Every bug I actually shipped was in the half I kept, which is roughly the point.

Worth doing on purpose, too: keep the seam clean enough that the decision stays reversible. Our projection tables carry no sync bookkeeping at all. No rev, no tombstone, no epoch, just the current state of each record. That started as a simplicity argument and turned into the exit hatch, because switching to Electric would change no backend code, only the client store and the service sitting next to Postgres. Choosing a young dependency is much easier to justify once you've made it cheap to un-choose.

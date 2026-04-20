# Migration 007 — design_config mm schema (docs only)

**Date:** 2026-04-20
**SQL required:** none (jsonb is flexible). Data cleanup required.

## What changed

`designs.design_config.sides[side][]` schema was:

```jsonc
{ "image": "data:image/png;base64,...", "position": { "x": 42, "y": -18 }, "scale": 1.2 }
```

where `position.x/y` were viewport pixels offset from the print-area center,
and `scale` was a factor on an aspect-fit "cover" render.

It is now:

```jsonc
{ "image": "data:image/png;base64,...", "xMm": 20, "yMm": -10, "widthMm": 180, "heightMm": 240 }
```

where offsets and dimensions are **millimeters** on the real garment. The
root of `design_config` also gains `"schemaVersion": 2`.

## Why

The old schema was viewport-dependent: the same layer saved on phone vs.
desktop produced different numbers because `position.x` was measured in the
screen pixels of the print-area DIV. Server-side rendering at 300 DPI could
not reproduce the original intent without knowing the save-time viewport
width.

Millimeters are the garment's real unit. Any renderer — current designer,
future mobile app, factory QA tool — can place a layer identically.

## Data migration

No SQL is required, but existing v1 rows are not reverse-compatible. Per
the factory XLSX plan (2026-04-20-factory-xlsx-export.md, Decision #13),
we chose a **clean slate delete** of pre-launch test data rather than a
best-effort converter that would have to guess the save-time viewport.

Run in Supabase SQL Editor **once, after deploying this release:**

```sql
delete from public.cart_items;
delete from public.designs;
```

Any cart_item that references a deleted design is CASCADE-removed by the
foreign key in migration 001. Orders are unaffected (order_items.design_id
is `on delete set null`).

## Rollout

1. Deploy the app code that writes the v2 schema.
2. Run the two DELETEs above.
3. New designs are saved in v2 format from that point forward.

## Future

If we ever need to support v1 reads (e.g. during a longer rollout window),
add a loader that branches on `schemaVersion` and best-effort-converts v1
using a hardcoded assumed viewport. Not worth building today.

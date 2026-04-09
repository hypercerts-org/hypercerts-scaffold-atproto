# Lexicon Migration Notes (v0.10.x -> v0.11.x)

## Context

This note documents a breaking validation difference introduced in lexicon
v0.11.x that affects edits to legacy hypercert records originally created under
v0.10.x.

## Description shape compatibility

Legacy hypercerts sometimes stored `description` as a **plain string**. In
v0.11.x, updates validate `description` against typed object shapes, so a plain
string can fail validation during edit unless it is normalized first.

**Important:** Leaflet description objects are **not** the blocker for this
specific edit failure; the blocker is the legacy plain-string `description`.

### Examples

**Legacy plain string (v0.10.x records may contain this):**

```json
{
  "description": "Reforestation activities across the watershed."
}
```

**Typed description string object (v0.11.x-compatible):**

```json
{
  "description": {
    "$type": "org.hypercerts.defs#descriptionString",
    "description": "Reforestation activities across the watershed."
  }
}
```

**Leaflet description object (supported, not the blocker here):**

```json
{
  "description": {
    "$type": "org.hypercerts.defs#descriptionLeaflet",
    "schema": "https://hypercerts.org/leaflet/v1",
    "content": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Reforestation details." }]
        }
      ]
    }
  }
}
```

## Why legacy edits fail

When updating a legacy record, v0.11.x validation expects `description` to be a
typed object (`descriptionString` or `descriptionLeaflet`). A plain string does
not match the v0.11.x schema, so the update fails unless the value is normalized
to a typed object.

## Normalization recommendation (concise)

Before attempting an edit on a legacy hypercert, normalize any plain-string
`description` into the typed object form:

_If `description` is a string, wrap it in_ `org.hypercerts.defs#descriptionString`.

## Lightweight verification checklist (old hypercert edits)

- [ ] Load the existing record and inspect `description`.
- [ ] If `description` is a string, convert it to the typed object format.
- [ ] Re-run the edit/update flow with the normalized description.
- [ ] Confirm validation passes in v0.11.x.

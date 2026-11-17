# Idea exploration

Use this folder for product questions that are worth exploring but are not yet approved implementation work. Keeping exploration separate prevents an interesting suggestion from silently becoming a commitment.

## How to use this folder

1. Copy `_template.md` to a short kebab-case filename such as `offline-backup.md`.
2. Describe the field problem before proposing technology.
3. Ask Codex to interview you, challenge assumptions, and compare options without changing app code.
4. Record evidence, constraints, the smallest useful experiment, and a decision.
5. If approved, add the outcome to `ROADMAP.md` and start a separate implementation chat and branch.

Suggested statuses are `seed`, `exploring`, `validated`, `planned`, `rejected`, and `shipped`.

## Good exploration prompts

```text
Interview me about this problem. Do not implement anything yet. Identify the user need,
challenge my assumptions, compare at least three options, and define the smallest test
that would tell us whether the idea is useful in the field.
```

```text
Review this idea against BioGlow's offline-first and privacy constraints. Rank the risks,
surface unanswered questions, and recommend whether to reject it, explore it further, or
promote a small version to the roadmap. Do not edit application code.
```

`ROADMAP.md` remains the source of truth for planned priorities. Files here preserve the reasoning behind decisions.

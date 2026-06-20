# 0004 — Menu templates deep-copy on apply

A **Menu Template** is a reusable Menu definition owned by a Venue: a name, description, and a nested structure of courses and items. Applying a template to a Session **deep-copies** the structure into a new per-Session `menu` row, with its own `course` and `menu_item` rows. Edits to the per-Session Menu never affect the template; edits to the template never affect Sessions that already used it. Lineage is recorded on `menu.derived_from_template_id` for analytics, not for re-sync.

**Why deep-copy, not shared polymorphic rows, not linked-with-resync**

Shared polymorphic rows (`menu_template` and `menu` both as parents of `course`/`menu_item`) would couple template edits to historical Sessions, which contradicts the "templates are a starting point" mental model. Linked-with-resync (the Session's menu always reflects the latest template) is the opposite failure: a coordinator who customized a Session would see their changes vanish when someone tweaks the template. Deep-copy is the simplest model that matches what coordinators actually do: "start from the wedding plated template, swap the soup for bisque, add a champagne toast."

**Consequences**

- The template's structure is stored as a denormalized JSON column on `menu_template` (or a normalized snapshot table) — the template is a _blueprint_ that gets expanded on apply, not a live parent of runtime rows.
- `menu`, `course`, `menu_item` are the runtime tables; they have no template FK except the optional lineage pointer.
- "Reset to template" is out of scope for MVP. The coordinator can re-apply a different template by clearing the Session's menu and applying again.
- Adding per-Session overrides that _also_ live on the template (e.g., "this template, with the cocktail for tonight only") is a v2 feature; the current model is "edits stay in the Session."

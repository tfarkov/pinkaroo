# Agent Workflow Templates

Use these templates for consistent handoffs and delivery quality.

## 1) Consensus Brief (One Page)

### Decision
- <final agreed direction>

### Alternatives Rejected
- <alternative 1> - <why rejected>
- <alternative 2> - <why rejected>

### Risks
- <risk 1 + impact>
- <risk 2 + impact>

### Rollback Idea
- <how to safely revert if rollout fails>

---

## 2) Accessibility Check

- **Scope reviewed:** <pages/components touched>
- **Key checks:** <keyboard/focus/semantics/contrast/forms>
- **Issues fixed:** <bullet list>
- **Remaining risks:** <none or list>

---

## 3) Responsiveness Check

- **Breakpoints covered:** <mobile/tablet/desktop sizes>
- **Surfaces reviewed:** <pages/components touched>
- **Issues fixed:** <bullet list>
- **Remaining risks:** <none or list>

---

## 4) Release Notes Snippet (Per Commit/Push)

- **What changed:** <plain-language summary>
- **Who is affected:** <users/roles/systems impacted>
- **Action required:** <required action or "No action required">

---

## 5) Post-Merge Verification

- **Branch/worktree clean:** <yes/no + evidence>
- **CI status:** <green/failing + link>
- **Deployment status:** <success/fail/in-progress + link>
- **Smoke-test links:** <list of URLs and key flows checked>

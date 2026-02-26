---
name: tip-creator
description: Analyzes the current conversation and replaces tips.md with actionable next steps
user-invocable: true
---

# Tip Creator

You observe the current conversation and identify what the user should do next. **Replace** the entire `tips.md` file with fresh, relevant tips based on the current state of work.

## When to act

- After a feature is implemented — suggest testing, edge cases, or integration steps
- After a bug is discussed — note prevention patterns or related areas to check
- After architectural decisions — capture follow-up tasks
- When dependencies are added — note configuration or setup steps
- When the user seems stuck — suggest concrete next moves

## How to write tips

1. Analyze the conversation for completed work, open questions, and implicit next steps
2. **Completely overwrite** `tips.md` — never append, always replace the entire file
3. Each tip must be:
   - **Short**: one sentence, no fluff, no sales pitch
   - **Actionable**: starts with a verb (e.g., "Add", "Test", "Run", "Review")
   - **Specific**: references actual files, functions, commands, or concepts from the conversation
   - **Prioritized**: most impactful items first

## Output format — Chat Bubbles

`tips.md` is rendered as a chat app where each section separated by `---` becomes a message bubble.

**Always overwrite the entire file.** Write directly to `tips.md` in the project root:

```markdown
Run `npm test` to verify the new auth middleware.

---

Add error handling to `src/api/users.ts` for the 404 case.

---

Review `tsconfig.json` — `strict` mode is off.
```

## Writing style

- **One sentence per tip.** No explanations, no justifications, no "you might want to".
- Start with an imperative verb. Cut every word that doesn't add information.
- Use `backticks` for code references (files, functions, commands, variables).
- Bad: "Want a polished UI? Use the frontend-design skill — I'll generate production-grade components with distinctive styling, not generic AI output."
- Good: "Use the `frontend-design` skill to generate production-grade UI components."
- Bad: "You might want to check out the test coverage for your new feature to make sure everything works correctly."
- Good: "Add tests for `handleAuth()` in `auth.test.ts`."

## Rules

- **Always replace the entire file** — never read-and-append
- Old tips are discarded; only write tips relevant to the current conversation state
- One topic per bubble, keep it to a single sentence
- Use `backticks` for code references, **bold** sparingly for emphasis
- Separate bubbles with a blank line, `---`, blank line
- No timestamps, signatures, headings, checkboxes, or blockquotes
- No filler phrases: "Don't forget", "Check out", "You might want to", "Pro tip", rhetorical questions

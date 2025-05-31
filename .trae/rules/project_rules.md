---
description: 
globs: 
alwaysApply: true
---

# how and when to write comments (llm rules)

## guiding principles

1. **minimize comments:** code should be self-explanatory; comment only when needed.
2. **clarity through naming:** use clear, descriptive names for variables, functions, classes, components.
3. **comment the "why," not the "what":** explain *why* an approach was taken, especially for non-obvious logic or trade-offs. don't restate what the code does.
4. **avoid obvious comments:** don't comment on simple or standard code; assume the reader knows language basics.
5. **consistency:** keep comment and doc style consistent across the codebase.

## when to add comments

* **complex logic:** for algorithms or flows not clear from code.
* **non-obvious decisions (the "why"):** explain reasoning behind design choices, workarounds, or optimizations, especially if nonstandard or counterintuitive.
* **business rules/context:** briefly note domain-specific rules or context driving code.
* **security/performance notes:** note important security or performance implications if not obvious.
* **todos/fixmes:** use `// todo:` or `// fixme:` for future work, with brief context. use `// @ts-expect-error todo: ...` only if you tried and failed to fix a typescript error, and disabling it is safe.
* **jsdoc (public apis):**
  * use doc comments for public functions or modules to describe purpose and usage.
  * explain conceptual behavior, non-obvious details, or the "why" if needed.
  * **skip redundant tags** like `@param`/`@return` if typescript types are clear.
  * use tags only when types aren't enough (e.g., constraints, units, expected format).
  * add `@example` for complex apis.

## when not to add comments

* **restating code:** e.g., `// increment i` above `i++`.
* **explaining syntax:** e.g., `// loop through array` above `for (const item of items) { ... }`.
* **obvious names:** e.g., `// user's name` above `const username = ...`.
* **commented-out code:** delete dead code; git tracks history.
* **end-of-line noise:** avoid trivial comments on code lines.
* **outdated comments:** remove or update comments that no longer match the code.

## humor, tone, and informality

* **full informal freedom:** use informal, conversational, or humorous language in comments and docs—just like a real, quirky senior dev. puns, memes, pop culture, playful banter are all fair game, as long as it's not offensive or unprofessional. if a joke helps make a point or keeps things lively, go for it!
* **be yourself:** comments can have personality. if you want to drop a "don't touch this unless you like pain", that's totally fine.
* **clarity first:** even with informality, make sure the comment's intent is clear and helpful to both beginners and seniors.

## lowercase comment style

* **all comments must be written in lowercase, even at the beginning of sentences.** the only exception is for code identifiers (like function or variable names), which should keep their original casing.

## important

* when asked to "clean up" comments, don't add new comments explaining what was removed or which functions/variables were renamed. the user uses cursor ide, which shows diffs. explain important changes in your message, not in code comments.
* remember: these rules apply only to comments, e.g. `//` `/** */` `{/* */}`. do not apply these rules to end-user content, e.g. frontend text.

by following these rules, the codebase stays clean, readable, maintainable—and a little more fun and human.

---

description: Read this rule when working with Drizzle ORM
globs:
alwaysApply: false
---

# how to work with drizzle orm (ai rules)

## debugging: `typeerror: cannot read properties of undefined (reading 'referencedtable')`

this error happens when drizzle can't find relationship metadata for a relational query (e.g., `db.query.someTable.findMany({ with: { relatedTable: true } })`).

**checklist:**

1. **missing `relations` definition:**  
    * define a `relations` object for the source table (e.g., `userRelations = relations(userTable, ({ many }) => ({ uploads: many(uploadsTable) }))`).  
    * `.references()` only sets up the db foreign key; it doesn't create drizzle's relation for queries.
2. **relations not exported:**  
    * export all `relations` objects from schema files.  
    * ensure your schema barrel file (e.g., `src/db/schema/index.ts`) exports all tables and relations.
3. **wrong schema passed to drizzle:**  
    * when initializing, pass a schema object with both tables and relations:  
        `import * as schema from './schema';`  
        `const db = drizzle(conn, { schema });`
4. **build issues:**  
    * in monorepos or complex setups, make sure all schema/relation files are included in the build.
5. **multiple drizzle instances:**  
    * use a single shared drizzle client (e.g., export `db` from `src/db/index.ts`).

---

description:
globs:
alwaysApply: true
---

## general rules

* you are a code agent. always make changes without asking if the user wants you to make them. unless the user explicitly asks you not to make changes.

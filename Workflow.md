# AI Development Workflow — Discipline Trader

## Development Rules

When modifying this repository, follow these rules strictly.

### 1. Small Iterations

* Never modify more than **3 files per step**
* Never generate more than **150 lines before committing**

### 2. Development Steps

For every module:

1. Create or modify files
2. Ensure the project builds (`npm run build`)
3. Stage changes
4. Commit with a clear message
5. Push to GitHub

### 3. Commit Format

Use conventional commits.

Examples:

```
feat: add behavior engine
feat: implement discipline scoring
fix: correct revenge trading detection
refactor: split disko engine logic
```

### 4. Branch Strategy

New features should be developed in feature branches.

Example:
```
feature/behavior-engine
feature/scoring-engine
feature/dashboard-ui
```

### 5. Build Validation

Before committing:

```
npm run build
```

If build fails:
* fix errors before committing

### 6. Module Order

Development should follow this order:

1. project setup
2. prisma schema
3. auth system
4. trading rules CRUD
5. trade journal
6. behavior engine
7. scoring engine
8. dashboard UI
9. disko AI widget
10. alerts system

### 7. Code Quality

* TypeScript strict
* Clear function names
* Business logic in `/engine`
* UI components in `/components`

### 8. Safety

Commit frequently to avoid losing work.

Never perform large refactors in a single step.

# Project overview

Physics-based rocket launch simulation built on Roblox.  
Simulates orbital mechanics and rigid-body rocket physics.

# Best practices

## Files

- All .ts modules under `src/shared/Modules` must be in CamelCase
  - Modules with children: `ModuleName.ts` → `ModuleName/index.ts`

### File organization

```
src/
├── client/       # Client-side rendering/UI
├── server/       # Server-side logic/validation
└── shared/       # Shared types & simulation core
     └── Modules/
          ├── BaseModule/      # Module hierarchy: All modules live here
          └── Libraries/       # External code
```

## Code

- Leave code cleaner than you left it
  - Debug code can be deleted
  - Include inline docs (`/** ... */`) for non-obvious code
- Simpler is better
- Refactor complex code
- Prefer double quotes
- Loose 80 column line limit

## TypeScript quirks

- `math` instead of `Math`
- `.size()` for array length
- No `Array` or `Object` global (Array *constructor* exists)
  - Use `new Array(len, val)` instead of `arr.fill(val)`
  - No `.keys()`, `.values()`, `.entries()` for `Map` and `Set` objects

# Code validation

Run `npm run typecheck` instead of `tsc --noEmit`, which is broken.
# Project Overview

Physics-based rocket launch simulation built on Roblox.  
Simulates orbital mechanics and rigid-body rocket physics.

# Best Practices

## Files

- All .ts modules under `src/shared/Modules` must be in CamelCase
  - Exception for modules with subclasses or multi-file modules: `ModuleName.ts` → `ModuleName/index.ts`

### File Organization

```
src/
├── client/       # Client-side rendering/UI
├── server/       # Server-side logic/validation
└── shared/       # Shared types & simulation core
     └── Modules/
          ├── BaseModule/      # Module hierarchy
          └── Libraries/       # External code
```

## Code

- Leave code cleaner than you left it
  - Code within modules used in debugging is unindented, can be deleted
  - Include inline docs (`/** ... */`)
- Simpler is better
- Refactor complex code
- Prefer double quotes
- Loose 80 column line limit
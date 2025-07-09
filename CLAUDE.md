# Claude Instructions

## Code Standards
- **Use ES6+ syntax**: Always use modern JavaScript/TypeScript standards
- Use `import/export` instead of `require()`
- Use arrow functions, const/let instead of var, template literals, etc.
- Follow existing code patterns and conventions in the project
- **Avoid code duplication**: When encountering duplicate functions or logic, prefer extracting them into utility functions in appropriate utils files rather than duplicating the code

## Build Process
After making any changes to TypeScript files, always run:
```bash
tsc --build
```

This ensures TypeScript compilation is up to date and catches any type errors before proceeding.


## Database Setup
- The project uses Prisma for database operations
- If database schema changes are made, run:
  ```bash
  npx prisma generate
  npx prisma db push
  ```

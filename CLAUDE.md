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

## Testing
**IMPORTANT**: After making any code changes, always run the test suite to ensure you haven't broken existing functionality:
```bash
npm run test:frontend
```

- Frontend tests run with Puppeteer and Jest
- Tests automatically set up isolated test database and servers
- Server runs on port 3001, Vite dev server on port 5173 during tests
- Test database is automatically cleaned up after each test run

## Database Setup
- The project uses Prisma for database operations
- If database schema changes are made, run:
  ```bash
  npx prisma generate
  npx prisma db push
  ```
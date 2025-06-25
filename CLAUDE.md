# Claude Instructions

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

## Testing
- Frontend tests: `npm run test:frontend`
- Server runs on port 3001, Vite dev server on port 5173
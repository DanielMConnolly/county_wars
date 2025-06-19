# Heroku Deployment Guide

## Prerequisites

1. Install the Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Have a Heroku account: https://signup.heroku.com/

## Deployment Steps

### 1. Create a Heroku App

```bash
# Login to Heroku
heroku login

# Create a new Heroku app (replace 'your-app-name' with your desired name)
heroku create your-app-name

# Or create without specifying a name (Heroku will generate one)
heroku create
```

### 2. Set Environment Variables

```bash
# Set production environment
heroku config:set NODE_ENV=production

# Set a secure JWT secret (generate a strong random string)
heroku config:set JWT_SECRET=your-super-secure-jwt-secret-here

# Optional: Set custom port (Heroku will set PORT automatically)
# heroku config:set PORT=3001
```

### 3. Deploy to Heroku

```bash
# Add Heroku remote (if not already added)
heroku git:remote -a your-app-name

# Deploy to Heroku
git push heroku main

# Or if you're on a different branch:
git push heroku your-branch:main
```

### 4. Open Your App

```bash
# Open the deployed app in your browser
heroku open

# View logs
heroku logs --tail
```

## Environment Variables

The following environment variables can be configured:

- `NODE_ENV`: Set to `production` for production deployment
- `JWT_SECRET`: Secret key for JWT token signing (required)
- `PORT`: Port number (automatically set by Heroku)
- `DATABASE_PATH`: SQLite database file path (defaults to `./county-wars.db`)

## Database

The app uses SQLite for data persistence. In production on Heroku:

- The database file will be created automatically on first run
- Database migrations will run automatically when the app starts
- Note: Heroku's ephemeral filesystem means the database will reset on dyno restarts

For persistent data in production, consider upgrading to PostgreSQL:

```bash
# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

## Troubleshooting

### View Logs
```bash
heroku logs --tail
```

### Restart Dynos
```bash
heroku restart
```

### Check App Status
```bash
heroku ps
```

### Scale Dynos
```bash
heroku ps:scale web=1
```

## Build Process

The deployment automatically runs:

1. `npm install` - Install dependencies
2. `npm run heroku-postbuild` - Builds both client and server
3. `npm run start:prod` - Starts the production server

## File Structure

```
├── Procfile              # Heroku process definition
├── package.json          # Dependencies and scripts
├── server/
│   ├── dist/             # Compiled server code (generated)
│   └── server.ts         # Server source
├── dist/                 # Built client code (generated)
└── src/                  # Client source code
```
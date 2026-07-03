# ShopEase API (Express + MySQL)

## Setup

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Create the database and tables:
   ```
   mysql -u root -p < db/schema.sql
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` with your MySQL credentials and the origin(s) your frontend is served from (CORS_ORIGIN).

4. Seed sample categories and products:
   ```
   npm run seed
   ```

5. Start the API:
   ```
   npm start
   ```
   The API listens on `http://localhost:4000` by default. Adjust `PORT` in `.env` if needed.

## Frontend

The `index.html` file points to `API_BASE = 'http://localhost:4000/api'`. If you serve the API
from a different host/port, update that constant. The frontend uses `credentials: 'include'`
on session-related calls, so `CORS_ORIGIN` in `.env` must exactly match the origin you're
serving `index.html` from (e.g. `http://localhost:5500` for VS Code Live Server).

## Endpoints

- `GET  /api/categories`
- `GET  /api/products?featured=1&category=slug&search=term&min_price=&max_price=&sort=`
- `GET  /api/products/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/session`
- `POST /api/orders` (requires session)
- `GET  /api/orders` (requires session)

# Training Institute Finder

Full-stack starter application for discovering training institutes in Kakinada and Visakhapatnam.

## Stack
- Node.js + Express
- MySQL
- HTML/CSS/JavaScript
- JWT + bcrypt login
- Google Maps navigation links

## Local setup
1. Install Node.js and MySQL.
2. Create the database by running `sql/schema.sql` in MySQL.
3. Copy `.env.example` to `.env` and set DB credentials and JWT_SECRET.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:10000`.

## Admin
The schema creates normal users. To make an account an admin, register it and then run:
`UPDATE users SET role='admin' WHERE email='your-email@example.com';`
Admin API endpoints are ready in `server.js`; a UI can be added as the next phase.

## Render
Create a Render Web Service from the GitHub repository. Build command: `npm install`. Start command: `npm start`. Add environment variables from `.env.example`. For MySQL, use a reachable MySQL server and set DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME in the Render service.

Important: sample institute records are placeholders. Verify institute names, addresses, contact details, courses, ratings and coordinates before publishing publicly.

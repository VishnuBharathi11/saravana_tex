/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { cors } from "hono/cors";
import { Hono } from 'hono';
import auth from './routes/auth';
import leads from "./routes/leads";
import customers from "./routes/customers";
import orders from "./routes/orders";
import followups from "./routes/followups";
import employees from "./routes/employees";
import notifications from "./routes/notifications";
import dashboard from "./routes/dashboard";
import { requireAuth } from './middleware/auth';
import { requireAdmin } from './middleware/roles';

type Bindings = {
	saravana_traders_db: D1Database;
};
const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: "https://saravana-tex.saravanatraders-web.workers.dev",
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get('/', (c) => {
	return c.json({
		success: true,
		service: 'saravana-traders-api',
		message: 'Backend is running',
	});
});

app.get('/api/health', (c) => {
	return c.json({
		success: true,
		service: 'saravana-traders-api',
		status: 'healthy',
		timestamp: new Date().toISOString(),
	});
});

app.get('/api/health/db', async (c) => {
	try {
		const result = await c.env.saravana_traders_db.prepare('SELECT 1 AS connected').first<{ connected: number }>();

		return c.json({
			success: true,
			database: 'connected',
			result: result?.connected === 1,
		});
	} catch (error) {
		console.error('D1 health check failed:', error);

		return c.json(
			{
				success: false,
				database: 'disconnected',
				error: 'Database connection failed',
			},
			500,
		);
	}
});

app.route('/api/auth', auth);
app.route("/api/leads", leads);
app.route("/api/customers", customers);
app.route("/api/orders", orders);
app.route("/api/follow-ups", followups);
app.route("/api/employees", employees);
app.route("/api/notifications", notifications);
app.route("/api/dashboard", dashboard);

export default app;

// app.get('/api/admin-test', requireAuth, requireAdmin, (c) => {
// 	const employee = c.get('employee');

// 	return c.json({
// 		success: true,
// 		message: 'Admin access granted',
// 		employee,
// 	});
// });

// app.get("/api/auth-test", requireAuth, (c) => {
//   const employee = c.get("employee");

//   return c.json({
//     success: true,
//     authenticated: true,
//     employee,
//   });
// });

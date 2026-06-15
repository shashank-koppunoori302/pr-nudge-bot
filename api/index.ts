import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { platformMiddleware } from './platform-sdk';
import teams from './routes/teams';
import cron from './routes/cron';

const app = new Hono();

app.use('*', cors());
app.use('*', platformMiddleware);

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.route('/', teams);
app.route('/', cron);

export default app;

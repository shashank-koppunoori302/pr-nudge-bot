import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { randomUUID } from 'crypto';

// In-memory store for local dev (no DynamoDB needed)
const teamsStore: Record<string, any> = {};

const app = new Hono();
app.use('*', cors());

app.get('/api/health', (c) => c.json({ status: 'ok' }));

app.get('/api/teams', (c) => {
  const items = Object.values(teamsStore).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return c.json(items);
});

app.post('/api/teams', async (c) => {
  const body = await c.req.json();
  const item = { teamId: randomUUID(), ...body, createdAt: new Date().toISOString() };
  teamsStore[item.teamId] = item;
  return c.json(item, 201);
});

app.get('/api/teams/:id', (c) => {
  const item = teamsStore[c.req.param('id')];
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

app.put('/api/teams/:id', async (c) => {
  const body = await c.req.json();
  const item = { teamId: c.req.param('id'), ...body };
  teamsStore[item.teamId] = item;
  return c.json(item);
});

app.delete('/api/teams/:id', (c) => {
  delete teamsStore[c.req.param('id')];
  return c.json({ deleted: true });
});

app.post('/api/teams/:id/run', (c) => {
  const item = teamsStore[c.req.param('id')];
  if (!item) return c.json({ error: 'Team not found' }, 404);
  // Simulated response in local dev
  return c.json({ ok: true, sent: true, prCount: 3 });
});

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('Local dev API running on http://localhost:3001');
});

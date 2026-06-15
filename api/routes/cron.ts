import { Hono } from 'hono';
import { db, tableName, ScanCommand } from '../platform-sdk';
import { runNudgeForTeam } from '../lib/nudge';

const cron = new Hono();

// Called by the platform cron (registered via Dashboard → Cron button)
cron.post('/api/cron/nudge', async (c) => {
  const result = await db.send(new ScanCommand({ TableName: tableName('teams', c) }));
  const teams = result.Items || [];

  if (!teams.length) {
    return c.json({ ok: true, message: 'No teams configured' });
  }

  const results = await Promise.allSettled(teams.map((t) => runNudgeForTeam(t as any)));

  const summary = results.map((r, i) => ({
    team: teams[i].name,
    ...(r.status === 'fulfilled' ? r.value : { sent: false, error: String(r.reason) }),
  }));

  return c.json({ ok: true, summary });
});

// Manual trigger for a single team (used by "Run now" button in the UI)
cron.post('/api/teams/:id/run', async (c) => {
  const { GetCommand } = await import('../platform-sdk');
  const result = await db.send(
    new GetCommand({ TableName: tableName('teams', c), Key: { teamId: c.req.param('id') } }),
  );
  if (!result.Item) return c.json({ error: 'Team not found' }, 404);

  const { sent, prCount } = await runNudgeForTeam(result.Item as any);
  return c.json({ ok: true, sent, prCount });
});

export default cron;

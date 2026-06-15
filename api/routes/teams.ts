import { Hono } from 'hono';
import { randomUUID } from 'crypto';
import { db, tableName, PutCommand, ScanCommand, GetCommand, DeleteCommand } from '../platform-sdk';

const teams = new Hono();

teams.get('/api/teams', async (c) => {
  const result = await db.send(new ScanCommand({ TableName: tableName('teams', c) }));
  const items = (result.Items || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return c.json(items);
});

teams.post('/api/teams', async (c) => {
  const body = await c.req.json();
  const item = {
    teamId: randomUUID(),
    name: body.name,
    channelId: body.channelId,
    repos: body.repos,
    members: body.members,
    createdAt: new Date().toISOString(),
  };
  await db.send(new PutCommand({ TableName: tableName('teams', c), Item: item }));
  return c.json(item, 201);
});

teams.get('/api/teams/:id', async (c) => {
  const result = await db.send(
    new GetCommand({ TableName: tableName('teams', c), Key: { teamId: c.req.param('id') } }),
  );
  if (!result.Item) return c.json({ error: 'Not found' }, 404);
  return c.json(result.Item);
});

teams.put('/api/teams/:id', async (c) => {
  const body = await c.req.json();
  const item = {
    teamId: c.req.param('id'),
    name: body.name,
    channelId: body.channelId,
    repos: body.repos,
    members: body.members,
    createdAt: body.createdAt,
  };
  await db.send(new PutCommand({ TableName: tableName('teams', c), Item: item }));
  return c.json(item);
});

teams.delete('/api/teams/:id', async (c) => {
  await db.send(
    new DeleteCommand({ TableName: tableName('teams', c), Key: { teamId: c.req.param('id') } }),
  );
  return c.json({ deleted: true });
});

export default teams;

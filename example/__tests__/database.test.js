const delay = ms => new Promise(res => setTimeout(res, ms));

describe('Database operations', () => {
  test('connects to database', async () => {
    await delay(1200);
    const conn = { status: 'connected', host: 'localhost' };
    expect(conn.status).toBe('connected');
  });

  test('inserts a record', async () => {
    await delay(1800);
    const record = { id: 1, name: 'Test User', created: true };
    expect(record.created).toBe(true);
  });

  test('queries records', async () => {
    await delay(2500);
    const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(rows.length).toBe(3);
  });

  test('wrong row count returned', async () => {
    await delay(900);
    const rows = [{ id: 1 }];
    expect(rows.length).toBe(10); // fails: got 1
  });

  test('updates a record', async () => {
    await delay(1500);
    const affected = 1;
    expect(affected).toBeGreaterThan(0);
  });

  test('update returns wrong affected count', async () => {
    await delay(700);
    const affected = 0;
    expect(affected).toBe(3); // fails: got 0
  });

  test('deletes a record', async () => {
    await delay(1000);
    const deleted = true;
    expect(deleted).toBe(true);
  });

  test('delete on missing id throws', async () => {
    await delay(600);
    const error = null;
    expect(error).not.toBeNull(); // fails: got null
  });

  test('transaction rollback on failure', async () => {
    await delay(2000);
    const rolledBack = true;
    expect(rolledBack).toBe(true);
  });

  test('transaction commit returns wrong status', async () => {
    await delay(1100);
    const status = 'pending';
    expect(status).toBe('committed'); // fails
  });

  test('intentional db failure - empty rows', async () => {
    await delay(800);
    const result = { rows: [] };
    expect(result.rows.length).toBe(5); // fails: got 0
  });

  test('schema migration fails', async () => {
    await delay(1400);
    const migrated = false;
    expect(migrated).toBe(true); // fails
  });

  test('connection pool exhausted', async () => {
    await delay(3000);
    const poolSize = 10;
    expect(poolSize).toBeGreaterThan(0);
  });

  test('connection timeout not handled', async () => {
    await delay(500);
    const timedOut = true;
    expect(timedOut).toBe(false); // fails
  });
});

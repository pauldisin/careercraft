import { describe, it, expect } from 'vitest';
import { errorCounter, aiRequestCounter, stripeWebhookCounter } from '../../src/lib/metrics';

describe('Metrics', () => {
  it('should increment error counter', async () => {
    errorCounter.inc({ type: 'ai_error', code: '429' });
    const val = await errorCounter.get();
    const count = val.values.find(v => v.labels.type === 'ai_error' && v.labels.code === '429')?.value;
    expect(count).toBeGreaterThan(0);
  });

  it('should increment ai request counter', async () => {
    aiRequestCounter.inc({ status: 'success', model: 'gemini-2.0-flash' });
    const val = await aiRequestCounter.get();
    const count = val.values.find(v => v.labels.status === 'success')?.value;
    expect(count).toBeGreaterThan(0);
  });
});

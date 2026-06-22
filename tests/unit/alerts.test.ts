import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { triggerAlert, trackError, compileHealthReport, getAlertHistory } from '../../src/lib/alerts';
import { errorCounter } from '../../src/lib/metrics';

describe('Alerting Service', () => {
  it('should trigger custom system alerts and store them in history', async () => {
    const initialCount = getAlertHistory().length;
    
    await triggerAlert(
      'API_KEY_FAILURE',
      'critical',
      'Unit Test Alert Key Issue',
      'Simulated diagnostic description'
    );
    
    const history = getAlertHistory();
    expect(history.length).toBe(initialCount + 1);
    expect(history[0].type).toBe('API_KEY_FAILURE');
    expect(history[0].severity).toBe('critical');
    expect(history[0].summary).toBe('Unit Test Alert Key Issue');
    expect(history[0].details).toBe('Simulated diagnostic description');
  });

  it('should track errors and increment the prometheus metrics counter', async () => {
    const metricOriginalVal = await errorCounter.get();
    const originalCount = metricOriginalVal.values.find(v => v.labels.type === 'unit_test_err' && v.labels.code === 'test_code')?.value || 0;
    
    trackError('unit_test_err', 'test_code', 'Some error happened');
    
    const metricNewVal = await errorCounter.get();
    const newCount = metricNewVal.values.find(v => v.labels.type === 'unit_test_err' && v.labels.code === 'test_code')?.value || 0;
    expect(newCount).toBe(originalCount + 1);
  });

  it('should compile a complete and structured health report', async () => {
    const report = await compileHealthReport();
    expect(report).toBeDefined();
    expect(report.status).toMatch(/HEALTHY|DEGRADED/);
    expect(report.uptime).toBeGreaterThan(0);
    expect(report.metrics).toBeDefined();
    expect(report.metrics.memory).toBeDefined();
    expect(report.metrics.memory.rss).toBeGreaterThan(0);
    expect(report.metrics.cpu).toBeDefined();
    expect(report.metrics.cpu.coresCount).toBeGreaterThan(0);
    expect(report.keysConfigured).toBeDefined();
    expect(report.alerts).toBeInstanceOf(Array);
  });
});

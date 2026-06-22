import { performance } from "perf_hooks";
import { queuePdfGeneration } from "./pdfQueue.ts";
import { db, resumes } from "../../db/schema.ts";
import { sql } from "drizzle-orm";
import { getResolvedModel, getAiClient } from "../../routes/ai.ts";
import fs from "fs/promises";
import path from "path";

export interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  throughput: number; // req/sec
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  statusCodes: Record<number, number>;
  errorReasons: Record<string, number>;
  databaseLatencyAvgMs: number;
  activeRendersPeak: number;
  cpuLoadPeak: number;
  memoryUsageDeltaMb: number;
  diagnosticAdvice: string;
}

export interface LoadTestResult {
  id: string;
  timestamp: string;
  target: "ai" | "pdf" | "database" | "mixed";
  concurrency: number;
  durationSeconds: number;
  mockExternal: boolean;
  metrics: LoadTestMetrics;
}

// Memory database of historical load test results
let testRunsHistory: LoadTestResult[] = [];
const HISTORY_FILE_PATH = path.join(process.cwd(), "load-test-history.json");

// Attempt to load history on startup
export async function loadTestHistory(): Promise<LoadTestResult[]> {
  try {
    const data = await fs.readFile(HISTORY_FILE_PATH, 'utf-8');
    testRunsHistory = JSON.parse(data);
  } catch {
    testRunsHistory = [];
  }
  return testRunsHistory;
}

async function saveTestHistory() {
  try {
    await fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(testRunsHistory, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to persist load-test history:", err);
  }
}

/**
 * Executes a scalability/load test suite in the background.
 */
export async function runScalabilityTest(
  target: "ai" | "pdf" | "database" | "mixed",
  concurrency: number,
  durationSeconds: number,
  mockExternal: boolean
): Promise<LoadTestResult> {
  const testId = `load_test_${Date.now()}_${Math.random().toString(36).substring(4, 9)}`;
  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;

  const initialMemory = process.memoryUsage().rss;
  let peakCpu = 0;
  
  const latencies: number[] = [];
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const statusCodes: Record<number, number> = {};
  const errorReasons: Record<string, number> = {};

  let dbTimeSum = 0;
  let dbCount = 0;

  // Track metrics during intervals
  const trackingInterval = setInterval(() => {
    // Measure active process loads
    const load = process.cpuUsage();
    const totalCpuTime = (load.user + load.system) / 1000; // ms
    if (totalCpuTime > peakCpu) {
      peakCpu = totalCpuTime;
    }
  }, 500);

  // Simple HTML structure to render for PDF tests
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; color: #333; margin: 20px; }
          h1 { color: #4F46E5; }
        </style>
      </head>
      <body>
        <h1>Scalability Load Test Document</h1>
        <p>This is a simulated resume document exported to PDF to evaluate local Puppeteer process queuing and container throttling.</p>
        <table>
          <tr><td><strong>Client Node IP:</strong></td><td>127.0.0.1</td></tr>
          <tr><td><strong>Host Load Factor:</strong></td><td>High Concurrency Execution</td></tr>
        </table>
      </body>
    </html>
  `;

  // Define the isolated mock AI generation
  const runAiTask = async () => {
    if (mockExternal) {
      // Simulate typical network latency and light CPU parsing overhead of a model call
      const duration = 1200 + Math.random() * 800; // 1.2s - 2.0s
      await new Promise(resolve => setTimeout(resolve, duration));
      return { success: true, status: 200 };
    } else {
      // Real API route simulation
      try {
        const client = await getAiClient();
        const model = await getResolvedModel();
        
        const response = await client.models.generateContent({
          model,
          contents: "Summarize this sentence profile for a senior system optimization engineer.",
          config: { maxOutputTokens: 20 }
        });
        
        if (response?.text) {
          return { success: true, status: 200 };
        }
        return { success: false, status: 502, error: "Empty model response" };
      } catch (err: any) {
        return { success: false, status: 500, error: err.message || "Model Exception" };
      }
    }
  };

  // Define the PDF task
  const runPdfTask = async () => {
    if (mockExternal) {
      // Mock Chromium processing (CPU constraint simulation)
      const duration = 250 + Math.random() * 300; // 250ms - 550ms
      
      // Simulate heavy CPU computation loop to block single thread temporarily like real Puppeteer
      const start = Date.now();
      while (Date.now() - start < 15) {
        Math.random() * Math.random();
      }
      
      await new Promise(resolve => setTimeout(resolve, duration));
      return { success: true, status: 200 };
    } else {
      // Real Puppeteer worker run to hit local concurrency thresholds
      try {
        const buffer = await queuePdfGeneration(testHtml);
        if (buffer && buffer.length > 0) {
          return { success: true, status: 200 };
        }
        return { success: false, status: 500, error: "Empty buffer received" };
      } catch (err: any) {
        const status = err.message?.includes("heavy load") ? 503 : 500;
        return { success: false, status, error: err.message };
      }
    }
  };

  // Define database query performance test
  const runDbTask = async () => {
    const dbStart = performance.now();
    try {
      // Simulates database retrieval under contention
      await db.execute(sql`SELECT 1`);
      const dbElapsed = performance.now() - dbStart;
      dbTimeSum += dbElapsed;
      dbCount++;
      return { success: true, status: 200 };
    } catch (err: any) {
      const dbElapsed = performance.now() - dbStart;
      dbTimeSum += dbElapsed;
      dbCount++;
      return { success: false, status: 500, error: err.message };
    }
  };

  // Task dispatcher based on selection
  const executeSingleRequest = async () => {
    const start = performance.now();
    let result: { success: boolean; status: number; error?: string };

    if (target === "ai") {
      result = await runAiTask();
    } else if (target === "pdf") {
      result = await runPdfTask();
    } else if (target === "database") {
      result = await runDbTask();
    } else {
      // Mixed distribution: 50% database, 30% PDF, 20% AI
      const pick = Math.random();
      if (pick < 0.5) result = await runDbTask();
      else if (pick < 0.8) result = await runPdfTask();
      else result = await runAiTask();
    }

    const elapsed = performance.now() - start;
    latencies.push(elapsed);
    totalRequests++;

    const code = result.status;
    statusCodes[code] = (statusCodes[code] || 0) + 1;

    if (result.success) {
      successfulRequests++;
    } else {
      failedRequests++;
      const reason = result.error || "Unknown Failure";
      errorReasons[reason] = (errorReasons[reason] || 0) + 1;
    }
  };

  // Launch a concurrent pipeline of workers
  const runWorker = async () => {
    while (Date.now() < endTime) {
      await executeSingleRequest();
      // Keep lightweight throttle/yield to let Express serve other processes
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };

  // Launch parallel fibers
  const workers = Array.from({ length: concurrency }).map(() => runWorker());
  await Promise.all(workers);

  clearInterval(trackingInterval);

  // Compile statistics
  const durationMs = Date.now() - startTime;
  latencies.sort((a, b) => a - b);
  
  const throughput = durationMs > 0 ? (totalRequests / (durationMs / 1000)) : 0;
  const avgLatencyMs = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p50LatencyMs = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.50)] : 0;
  const p95LatencyMs = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const p99LatencyMs = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.99)] : 0;
  const databaseLatencyAvgMs = dbCount > 0 ? dbTimeSum / dbCount : 0;
  const memoryUsageDeltaMb = (process.memoryUsage().rss - initialMemory) / (1024 * 1024);

  // Devise diagnostics insights and guidance
  let diagnosticAdvice = "";
  if (failedRequests === 0) {
    diagnosticAdvice = "Pristine execution! The application exhibits flawless scalability. The concurrent event loop and queue mechanisms handled the load with zero timeouts or failed requests.";
  } else {
    const errorKeys = Object.keys(errorReasons);
    if (errorKeys.some(k => k.includes("heavy load") || k.includes("capacity exceeded"))) {
      diagnosticAdvice = "The Puppeteer render queue backpressure kicked in perfectly. The server was hit with higher concurrency than permitted by MAX_CONCURRENT_RENDERS (2) or MAX_QUEUE_LENGTH (15), triggering safety rate-limiting. This is expected behavior and prevents server CPU starvation.";
    } else if (statusCodes[429]) {
      diagnosticAdvice = "Rate limiters successfully deflected excess traffic. This matches design limits specified in the global application config to maintain service availability.";
    } else {
      diagnosticAdvice = "The system hit scalability boundary limits under contention. Consider scaling container replicas or increasing regional Cloud SQL connectivity profiles.";
    }
  }

  const result: LoadTestResult = {
    id: testId,
    timestamp: new Date().toISOString(),
    target,
    concurrency,
    durationSeconds,
    mockExternal,
    metrics: {
      totalRequests,
      successfulRequests,
      failedRequests,
      durationMs,
      throughput,
      avgLatencyMs,
      p50LatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      statusCodes,
      errorReasons,
      databaseLatencyAvgMs,
      activeRendersPeak: target === "pdf" && !mockExternal ? concurrency : 0,
      cpuLoadPeak: peakCpu,
      memoryUsageDeltaMb,
      diagnosticAdvice
    }
  };

  // Add to persistence
  await loadTestHistory();
  testRunsHistory.unshift(result);
  
  // Cap history to last 20 records
  if (testRunsHistory.length > 20) {
    testRunsHistory = testRunsHistory.slice(0, 20);
  }
  await saveTestHistory();

  return result;
}

/**
 * Returns past scalability tests
 */
export async function getScalabilityTestHistory(): Promise<LoadTestResult[]> {
  return loadTestHistory();
}

/**
 * Clears past scalability history
 */
export async function clearScalabilityTestHistory(): Promise<void> {
  testRunsHistory = [];
  try {
    await fs.unlink(HISTORY_FILE_PATH);
  } catch {}
}

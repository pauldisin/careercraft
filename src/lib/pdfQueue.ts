import puppeteer from 'puppeteer';
import { redisClient } from './redis.ts';
import { v4 as uuidv4 } from 'uuid';
import { db, settings } from '../../db/schema.ts';

export interface PDFJob {
  id: string;
  html: string;
}

// Maximum concurrent Puppeteer renders allowed on the host to protect resource exhaustion
const MAX_CONCURRENT_RENDERS = 2;
// Maximum pending jobs allowed in the queue
const MAX_QUEUE_LENGTH = 15;
// Maximum duration a PDF render is permitted to run (15 seconds)
const JOB_TIMEOUT_MS = 15000;
// Number of retries on failure (3 attempts total)
const MAX_RETRIES = 2;

let activeRenders = 0;

interface QueueItem {
  job: PDFJob;
  resolve: (buffer: Buffer) => void;
  reject: (err: Error) => void;
}

const localQueue: QueueItem[] = [];

// Persistent browser instance to avoid spawning overhead (cold-boot penalty)
let cachedBrowser: any = null;

/**
 * Lazy initializer / manager for persistent browser instances to maintain robustness.
 */
async function getBrowserInstance() {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }
  
  if (cachedBrowser) {
    try {
      await cachedBrowser.close();
    } catch (_) {}
    cachedBrowser = null;
  }

  console.log('[PDF Worker] Spawning highly optimized persistent headful/headless browser pooled session...');
  cachedBrowser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // protect shared memory limits
      '--disable-gpu',           // disable graphics card pipeline for memory conservation
      '--no-first-run',          // skip onboarding processes
      '--no-zygote',             // skip fork overhead
      '--single-process'         // force single process model for container isolation
    ]
  });
  
  return cachedBrowser;
}

/**
 * Return configuration settings from Database dynamically, fallback to environment vars
 */
export async function getPdfServiceConfig() {
  try {
    const dbSettings = await db.select().from(settings);
    const serviceType = dbSettings.find(s => s.key === 'PDF_SERVICE_TYPE')?.value || process.env.PDF_SERVICE_TYPE || 'puppeteer';
    const serviceUrl = dbSettings.find(s => s.key === 'PDF_SERVICE_URL')?.value || process.env.PDF_GENERATOR_SERVICE_URL || process.env.PDF_SERVICE_URL || '';
    const serviceToken = dbSettings.find(s => s.key === 'PDF_SERVICE_TOKEN')?.value || process.env.PDF_GENERATOR_SERVICE_TOKEN || process.env.PDF_SERVICE_TOKEN || '';
    return { serviceType, serviceUrl, serviceToken };
  } catch (err) {
    return {
      serviceType: process.env.PDF_SERVICE_TYPE || 'puppeteer',
      serviceUrl: process.env.PDF_GENERATOR_SERVICE_URL || process.env.PDF_SERVICE_URL || '',
      serviceToken: process.env.PDF_GENERATOR_SERVICE_TOKEN || process.env.PDF_SERVICE_TOKEN || ''
    };
  }
}

/**
 * Executes a Puppeteer render job with browser recycling, timeout limits and automatic retry logic.
 */
async function executeRenderWithTimeoutAndRetry(html: string, maxRetries = MAX_RETRIES): Promise<Buffer> {
  let attempt = 0;
  while (true) {
    attempt++;
    let browser: any = null;
    let page: any = null;
    let timer: NodeJS.Timeout | null = null;

    try {
      const renderPromise = (async () => {
        browser = await getBrowserInstance();
        page = await browser.newPage();
        
        // Enforce hard timeouts on the page operations to prevent infinite freezes
        page.setDefaultNavigationTimeout(JOB_TIMEOUT_MS);
        page.setDefaultTimeout(JOB_TIMEOUT_MS);

        // Adjust viewport to a clean printable layout standard
        await page.setViewport({
          width: 714,
          height: 1123,
          deviceScaleFactor: 1
        });

        await page.setContent(html, { waitUntil: 'networkidle0', timeout: JOB_TIMEOUT_MS });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
          timeout: JOB_TIMEOUT_MS,
          margin: {
            top: '40px',
            right: '40px',
            bottom: '40px',
            left: '40px'
          }
        });

        await page.close();
        return Buffer.from(pdfBuffer);
      })();

      // Safeguard against engine lock-ins with a standard JS promise-level timeout race
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`PDF rendering execution timed out after ${JOB_TIMEOUT_MS}ms`));
        }, JOB_TIMEOUT_MS);
      });

      const result = await Promise.race([renderPromise, timeoutPromise]);
      
      if (timer) clearTimeout(timer);
      
      return result;

    } catch (err: any) {
      if (timer) clearTimeout(timer);
      
      if (page) {
        try {
          await page.close();
        } catch (_) {}
      }

      // If persistent browser gets corrupted or unresponsive, close and clear it
      if (browser) {
        console.warn(`[PDF Worker] Persistent browser crashed or errored, Recycling instance.`);
        try {
          await browser.close();
        } catch (_) {}
        cachedBrowser = null;
      }

      console.error(`[PDF Worker] Attempt ${attempt} failed: ${err.message}`);

      if (attempt <= maxRetries) {
        const delay = 1000 * attempt; // Exponential fallback
        console.log(`[PDF Worker] Retrying local render job in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      
      throw new Error(`Local PDF generation failed after ${attempt} attempts. Last error: ${err.message}`);
    }
  }
}

/**
 * Executes a serverless offloaded request with timeout limits and automatic retry logic.
 */
async function fetchServerlessPdfWithTimeoutAndRetry(serverlessUrl: string, html: string, token = '', maxRetries = MAX_RETRIES): Promise<Buffer> {
  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS);

    try {
      console.log(`[PDF Offloader] POSTing load to custom microservice: ${serverlessUrl} (Attempt ${attempt}/${maxRetries + 1})`);
      const response = await fetch(serverlessUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': token || process.env.PDF_GENERATOR_SERVICE_TOKEN || ''
        },
        body: JSON.stringify({ html }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Serverless PDF service returned non-OK status: ${response.status} ${response.statusText} - ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      const errorMsg = isTimeout ? `Request timed out after ${JOB_TIMEOUT_MS}ms` : err.message;

      console.error(`[PDF Offloader] Attempt ${attempt} failed: ${errorMsg}`);

      if (attempt <= maxRetries) {
        const delay = 1000 * attempt;
        console.log(`[PDF Offloader] Retrying serverless connection in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw new Error(`Serverless PDF generation failed after ${attempt} attempts. Last error: ${errorMsg}`);
    }
  }
}

/**
 * Executes a Gotenberg PDF generation request with form boundaries and automatic formatting.
 */
async function fetchGotenbergPdfWithTimeoutAndRetry(gotenbergUrl: string, html: string, maxRetries = MAX_RETRIES): Promise<Buffer> {
  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), JOB_TIMEOUT_MS);

    try {
      console.log(`[PDF Offloader] POSTing load to Gotenberg cluster: ${gotenbergUrl} (Attempt ${attempt}/${maxRetries + 1})`);
      
      const formData = new FormData();
      const htmlBlob = new Blob([html], { type: 'text/html' });
      formData.append('files', htmlBlob, 'index.html');
      
      // Inject standard Gotenberg margins configuration (in inches, mapped from page.pdf setup)
      formData.append('marginTop', '0.4');
      formData.append('marginBottom', '0.4');
      formData.append('marginRight', '0.4');
      formData.append('marginLeft', '0.4');
      formData.append('preferCssPageSize', 'true');
      formData.append('printBackground', 'true');

      // Safeguard URL structure: Gotenberg expects HTML conversions in the forms pathway
      const cleanUrl = gotenbergUrl.endsWith('/forms/chromium/convert/html')
        ? gotenbergUrl
        : `${gotenbergUrl.replace(/\/$/, '')}/forms/chromium/convert/html`;

      const response = await fetch(cleanUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gotenberg service returned non-OK status: ${response.status} ${response.statusText} - ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      const errorMsg = isTimeout ? `Request timed out after ${JOB_TIMEOUT_MS}ms` : err.message;

      console.error(`[PDF Offloader] Gotenberg attempt ${attempt} failed: ${errorMsg}`);

      if (attempt <= maxRetries) {
        const delay = 1000 * attempt;
        console.log(`[PDF Offloader] Retrying Gotenberg connection in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw new Error(`Gotenberg PDF generation failed after ${attempt} attempts. Last error: ${errorMsg}`);
    }
  }
}

/**
 * Triggers queue processing for pending PDF jobs.
 */
function processQueue() {
  if (activeRenders >= MAX_CONCURRENT_RENDERS || localQueue.length === 0) {
    return;
  }

  const { job, resolve, reject } = localQueue.shift()!;
  activeRenders++;

  console.log(`[PDF Worker] Processing job ${job.id}. Active renders: ${activeRenders}/${MAX_CONCURRENT_RENDERS}`);

  executeRenderWithTimeoutAndRetry(job.html)
    .then((buffer) => {
      resolve(buffer);
    })
    .catch((err) => {
      console.error(`[PDF Worker] Job ${job.id} failed with error:`, err);
      reject(err);
    })
    .finally(() => {
      activeRenders--;
      console.log(`[PDF Worker] Job ${job.id} completed. Active renders: ${activeRenders}/${MAX_CONCURRENT_RENDERS}`);
      // Process next job
      processQueue();
    });
}

/**
 * Enqueues a PDF generation request.
 * Resolves live service configuration (database or environment based),
 * and delegates workload to Gotenberg, Serverless API, or highly optimized local pool queue.
 */
export async function queuePdfGeneration(html: string): Promise<Buffer> {
  // 1. Resolve dynamic configurations
  const config = await getPdfServiceConfig();

  if (config.serviceType === 'gotenberg' && config.serviceUrl) {
    console.log(`[PDF Offloader] Offloading load to dedicated Gotenberg microservice...`);
    return fetchGotenbergPdfWithTimeoutAndRetry(config.serviceUrl, html);
  }

  if ((config.serviceType === 'serverless' || config.serviceType === 'custom') && config.serviceUrl) {
    console.log(`[PDF Offloader] Offloading load to custom API serverless endpoint...`);
    return fetchServerlessPdfWithTimeoutAndRetry(config.serviceUrl, html, config.serviceToken);
  }

  // 2. Queue-based processing locally (using persistent optimized chromium pool)
  if (localQueue.length >= MAX_QUEUE_LENGTH) {
    console.warn(`[PDF Queue] Rejecting request. Queue capacity of ${MAX_QUEUE_LENGTH} exceeded.`);
    throw new Error("The PDF generation server is currently under heavy load. Please wait a few seconds and try again.");
  }

  const jobId = uuidv4();
  console.log(`[PDF Queue] Enqueuing local job ${jobId}. Active renders: ${activeRenders}, Queued: ${localQueue.length}/${MAX_QUEUE_LENGTH}`);

  return new Promise<Buffer>((resolve, reject) => {
    localQueue.push({
      job: { id: jobId, html },
      resolve,
      reject
    });
    
    // Process the queue
    processQueue();
  });
}

import client from 'prom-client';

// Enable default system metrics (CPU, Memory, Event Loop, GC)
client.collectDefaultMetrics({ prefix: 'iranse_' });

export const httpRequestCounter = new client.Counter({
  name: 'iranse_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new client.Histogram({
  name: 'iranse_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export const applicationSubmissionCounter = new client.Counter({
  name: 'iranse_application_submissions_total',
  help: 'Total number of application submissions processed by BullMQ worker',
  labelNames: ['status', 'portal'],
});

export const rateLimitHitCounter = new client.Counter({
  name: 'iranse_rate_limit_hits_total',
  help: 'Total number of rate limit threshold hits',
  labelNames: ['portal'],
});

export const queueDepthGauge = new client.Gauge({
  name: 'iranse_queue_depth',
  help: 'Current depth of BullMQ queues',
  labelNames: ['queue_name'],
});

export async function getMetrics(): Promise<string> {
  return client.register.metrics();
}

export const metricsContentType = client.register.contentType;

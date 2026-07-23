import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { ingestionQueue, applicationsQueue, matchingQueue } from '../queue/queues.js';

/**
 * Sets up Bull Board dashboard for visual inspection of BullMQ queue jobs and failures.
 * Accessible at `/admin/queues`.
 */
export function setupBullBoard() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(ingestionQueue),
      new BullMQAdapter(applicationsQueue),
      new BullMQAdapter(matchingQueue),
    ],
    serverAdapter,
  });

  return serverAdapter.getRouter();
}

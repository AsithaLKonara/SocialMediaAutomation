/**
 * Server entry point for AutoPost AI
 * This file initializes the scheduler when running in standalone mode
 */

import postScheduler from './lib/scheduler';

// Initialize scheduler
if (process.env.AUTO_START_SCHEDULER === 'true' || process.env.NODE_ENV === 'production') {
  console.log('🚀 AutoPost AI Scheduler - Starting...');
  postScheduler.start();
}

export default postScheduler;


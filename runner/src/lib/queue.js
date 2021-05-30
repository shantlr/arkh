class Queue {
  constructor(key, jobProcessor) {
    this.key = key;
    this.jobs = [];
    this.started = false;
    this.jobProcessor = jobProcessor;

    this.isProcessingJobs = false;
  }
  /**
   * @param {...{ id: string|number, data: any }} jobs
   */
  push(...jobs) {
    this.jobs.push(...jobs);
    this.processJobs();
  }
  cancelJob(jobId) {
    const idx = this.jobs.findIndex((j) => j.id === jobId);
    if (idx !== -1) {
      const job = this.jobs[idx];
      this.jobs.splice(idx, 1);
      return job;
    }

    return null;
  }

  async processJobs() {
    if (this.isProcessingJobs) {
      return true;
    }
    this.isProcessingJobs = true;
    while (this.jobs.length > 0) {
      if (!this.started) {
        return;
      }

      const job = this.jobs.shift();
      await this.jobProcessor(job, this.key);
      break;
    }
    this.isProcessingJobs = false;
  }

  start() {
    if (!this.started) {
      this.started = true;
      this.processJobs();
    }
  }
  stop() {
    this.started = false;
  }
}

export class QueueManager {
  /**
   *
   * @param {(job: { id: string, data: any }, queueKey: string) => void | Promise<void>} jobProcessor
   */
  constructor(jobProcessor) {
    /**
     * @type {Map<string|number, Queue>}
     */
    this.queues = new Map();
    this.jobProcessor = jobProcessor;
    this.started = false;
  }

  /**
   *
   * @param {string|number} key
   * @returns {Queue}
   */
  getQueue(key) {
    if (!this.queues.has(key)) {
      const queue = new Queue(key, this.jobProcessor);
      if (this.started) {
        queue.start();
      }
      this.queues.set(key, queue);
    }

    return this.queues.get(key);
  }

  /**
   *
   * @param {string|number} key
   * @param  {...{ id: string|number, data: any }} jobs
   */
  push(key, ...jobs) {
    const queue = this.getQueue(key);
    queue.push(...jobs);
    return this;
  }

  start() {
    if (!this.started) {
      this.queues.forEach((queue) => {
        queue.start();
      });
      this.started = true;
    }
  }
  stop() {
    if (this.started) {
      this.queues.forEach((queue) => {
        queue.stop();
      });
      this.started = false;
    }
  }
}

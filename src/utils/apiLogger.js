// src/utils/apiLogger.js
// Utility for logging API calls to track and debug excessive requests

const ENABLE_LOGGING = import.meta.env.DEV; // Only enable in development

class APILogger {
  constructor() {
    this.logs = [];
    this.enabled = ENABLE_LOGGING;
  }

  log(entry) {
    if (!this.enabled) return;

    const logEntry = {
      timestamp: Date.now(),
      time: new Date().toISOString(),
      ...entry,
    };

    this.logs.push(logEntry);

    // Console log with color coding
    const color = entry.fromCache ? '#10b981' : '#ef4444'; // green for cache, red for network
    console.log(
      `%c[API] ${entry.endpoint}`,
      `color: ${color}; font-weight: bold`,
      {
        source: entry.source,
        params: entry.params,
        fromCache: entry.fromCache,
        duration: entry.duration,
      }
    );
  }

  getLogs() {
    return this.logs;
  }

  getStats() {
    const stats = {
      total: this.logs.length,
      fromCache: this.logs.filter(l => l.fromCache).length,
      fromNetwork: this.logs.filter(l => !l.fromCache).length,
      byEndpoint: {},
      bySource: {},
    };

    this.logs.forEach(log => {
      // Count by endpoint
      if (!stats.byEndpoint[log.endpoint]) {
        stats.byEndpoint[log.endpoint] = { total: 0, cache: 0, network: 0 };
      }
      stats.byEndpoint[log.endpoint].total++;
      if (log.fromCache) {
        stats.byEndpoint[log.endpoint].cache++;
      } else {
        stats.byEndpoint[log.endpoint].network++;
      }

      // Count by source
      if (!stats.bySource[log.source]) {
        stats.bySource[log.source] = { total: 0, cache: 0, network: 0 };
      }
      stats.bySource[log.source].total++;
      if (log.fromCache) {
        stats.bySource[log.source].cache++;
      } else {
        stats.bySource[log.source].network++;
      }
    });

    return stats;
  }

  printStats() {
    if (!this.enabled) return;

    const stats = this.getStats();
    console.group('%c[API Stats]', 'color: #3b82f6; font-weight: bold; font-size: 14px');
    console.log('Total calls:', stats.total);
    console.log('From cache:', stats.fromCache);
    console.log('From network:', stats.fromNetwork);
    console.log('\nBy endpoint:', stats.byEndpoint);
    console.log('\nBy source:', stats.bySource);
    console.groupEnd();
  }

  clear() {
    this.logs = [];
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

// Singleton instance
export const apiLogger = new APILogger();

// Expose to window for debugging
if (typeof window !== 'undefined' && ENABLE_LOGGING) {
  window.apiLogger = apiLogger;
}

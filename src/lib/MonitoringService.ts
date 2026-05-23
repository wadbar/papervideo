import { sysLog } from './sys';

class MonitoringService {
  private readonly threshold = 85;
  private readonly durationMs = 5 * 60 * 1000; // 5 minutes

  private cpuExceedStartTime: number | null = null;
  private ramExceedStartTime: number | null = null;

  public logMetric(cpuUsage: number, ramUsage: number) {
    const now = Date.now();

    // CPU Tracking
    if (cpuUsage > this.threshold) {
      if (this.cpuExceedStartTime === null) {
        this.cpuExceedStartTime = now;
      } else if (now - this.cpuExceedStartTime >= this.durationMs) {
        sysLog(`WARNING: CPU usage has exceeded ${this.threshold}% for more than 5 minutes.`, 'warn');
        this.cpuExceedStartTime = now; // Reset timer after alert
      }
    } else {
      this.cpuExceedStartTime = null;
    }

    // RAM Tracking
    if (ramUsage > this.threshold) {
      if (this.ramExceedStartTime === null) {
        this.ramExceedStartTime = now;
      } else if (now - this.ramExceedStartTime >= this.durationMs) {
        sysLog(`WARNING: RAM usage has exceeded ${this.threshold}% for more than 5 minutes.`, 'warn');
        this.ramExceedStartTime = now; // Reset timer after alert
      }
    } else {
      this.ramExceedStartTime = null;
    }
  }
}

export const monitoringService = new MonitoringService();

/**
 * Task Management Module
 * Optimized multi-threaded logic execution for browser environments.
 */

export class WorkerManager {
  private static instance: WorkerManager;
  private workers: Map<string, Worker> = new Map();

  private constructor() {}

  public static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  public runTask(id: string, taskCode: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([taskCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      this.workers.set(id, worker);

      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
        this.workers.delete(id);
      };

      worker.onerror = (err) => {
        reject(err);
        worker.terminate();
        this.workers.delete(id);
      };

      worker.postMessage(payload);
    });
  }
}

/**
 * PaperCreeper System Utilities
 * Industrial-grade logging and monitoring for resource-intensive operations.
 */

export type LogType = 'info' | 'warn' | 'error';

export function sysLog(message: string, type: LogType = 'info') {
    const detail = { message, type, id: crypto.randomUUID(), timestamp: Date.now() };
    const event = new CustomEvent('sys_log', { detail });
    window.dispatchEvent(event);
    
    // Defer console output to idle time to avoid frame drops during heavy UI updates
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
            const prefix = `[SYS_${type.toUpperCase()}]`;
            const style = type === 'error' ? 'color: #ff4d4d; font-weight: bold;' : type === 'warn' ? 'color: #ffcc00' : 'color: #3b82f6';
            console.log(`%c${prefix} ${message}`, style);
        }, { timeout: 1000 });
    } else {
        const prefix = `[SYS_${type.toUpperCase()}]`;
        const style = type === 'error' ? 'color: #ff4d4d; font-weight: bold;' : type === 'warn' ? 'color: #ffcc00' : 'color: #3b82f6';
        console.log(`%c${prefix} ${message}`, style);
    }
}

export function validateProjectIntegrity(project: any): boolean {
    if (!project || !project.id || !Array.isArray(project.scenes)) {
        sysLog('Project Integrity Compromised: Invalid structure detected.', 'error');
        return false;
    }
    return true;
}

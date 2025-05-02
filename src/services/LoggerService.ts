import { formatDate } from '../utils/FormatDate';

export class LoggerService {
    private static readonly BLUE = '\x1b[34m';
    private static readonly RED = '\x1b[31m';
    private static readonly YELLOW = '\x1b[33m';
    private static readonly GRAY = '\x1b[90m';
    private static readonly RESET = '\x1b[0m';

    static info(message: string, metadata?: any): void {
        const timestamp = formatDate(new Date());
        console.log(`[${this.BLUE}INFO${this.RESET}] ${this.GRAY}${timestamp}${this.RESET} - ${message}`, metadata ? metadata : '');
    }

    static error(message: string, error?: any): void {
        const timestamp = formatDate(new Date());
        console.error(`[${this.RED}ERROR${this.RESET}] ${this.GRAY}${timestamp}${this.RESET} - ${message}`, error ? error : '');
    }

    static warn(message: string, metadata?: any): void {
        const timestamp = formatDate(new Date());
        console.warn(`[${this.YELLOW}WARN${this.RESET}] ${this.GRAY}${timestamp}${this.RESET} - ${message}`, metadata ? metadata : '');
    }
}
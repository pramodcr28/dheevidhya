export interface ApiResponse<T = any> {
    timestamp: string;
    status: number;
    message: string;
    data: T;
    error?: string;
}

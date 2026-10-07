export interface DecodedToken {
    sub?: string | number;
    email?: string;
    username?: string;
    role?: string;
    exp?: number;
    iat?: number;
    [key: string]: any;
}

export function decodeJwtPayload(token: string): DecodedToken | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function isTokenExpired(token: string | null | undefined, thresholdSeconds: number = 30): boolean {
    if (!token) return true;
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp - currentTime <= thresholdSeconds;
}

export function clearUserSession() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        document.cookie = 'token=; Max-Age=0; path=/;';
        document.cookie = 'user=; Max-Age=0; path=/;';
    } catch (e) {
        console.warn('Session clearance warning:', e);
    }
}

export function validateClientSession(): boolean {
    if (typeof window === 'undefined') return true;
    const token = localStorage.getItem('token');
    if (!token) return false;
    if (isTokenExpired(token)) {
        clearUserSession();
        return false;
    }
    return true;
}

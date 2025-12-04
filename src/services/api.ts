
// Automatically detect if running locally or on production
// If on localhost (dev), we assume the PHP server is running on port 80 or similar, often via proxy or direct URL
// For Hostinger, the api folder will be at /api/index.php relative to the domain
const BASE_URL = window.location.hostname === 'localhost' 
    ? '/api/index.php' // You might need to change this if your local PHP server is on a different port, e.g. 'http://localhost:8000/api/index.php'
    : '/api/index.php';

interface ApiResponse {
    success: boolean;
    data?: any;
    user?: any;
    message?: string;
}

export const api = {
    async register(email: string, password: string, salonName: string) {
        try {
            const res = await fetch(`${BASE_URL}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, salonName })
            });
            return await res.json() as ApiResponse;
        } catch (e) {
            return { success: false, message: 'Network error or invalid JSON response' };
        }
    },

    async login(email: string, password: string) {
        try {
            const res = await fetch(`${BASE_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await res.json() as ApiResponse;
        } catch (e) {
            return { success: false, message: 'Network error' };
        }
    },

    async saveData(userId: string | number, key: string, value: any) {
        if (!userId) return;
        await fetch(`${BASE_URL}?action=save_data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, key, value })
        });
    },

    async loadAllData(userId: string | number) {
        if (!userId) return { success: false, message: 'No User ID' };
        try {
            const res = await fetch(`${BASE_URL}?action=load_data&userId=${userId}`);
            return await res.json() as ApiResponse;
        } catch (e) {
            return { success: false, message: 'Network error' };
        }
    }
};

const rawUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
export const apiUrl = new URL(rawUrl).origin;
// No admin data calls until verified authentication and authorization exist.

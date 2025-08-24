import { toast } from 'react-hot-toast';

export function isAuth401Error(err: any): boolean {
  try {
    if (!err) return false;
    const status = (err as any)?.response?.status ?? (err as any)?.status;
    if (status === 401) return true;

    const msg =
      typeof err === 'string'
        ? err
        : (err?.message ?? (typeof err?.toString === 'function' ? err.toString() : ''));

    if (typeof msg === 'string' && /401|unauthorized/i.test(msg)) return true;
    return false;
  } catch {
    return false;
  }
}

export function shouldSuppressAuth401ToastMessage(message?: string): boolean {
  if (!message) return false;
  return /401|unauthorized/i.test(message);
}
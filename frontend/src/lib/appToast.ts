import toast from "react-hot-toast";
import type { ToastOptions } from "react-hot-toast";

/** Un slot para shortlist y similares: `id` fijo hace que cada aviso reemplace al anterior, sin afectar login/register. */
const UI_TOAST_ID = "app-toast-ui";

function uiOpts(options?: ToastOptions): ToastOptions & { id: string } {
  return { ...options, id: UI_TOAST_ID };
}

/**
 * Toasts de la app fuera de login/register. Un “canal” (mismo `id` → una notificación a la vez ahí).
 */
export const appToast = {
  error: (message: string, options?: ToastOptions) => toast.error(message, uiOpts(options)),
  success: (message: string, options?: ToastOptions) => toast.success(message, uiOpts(options)),
  /** Mensaje neutro (p. ej. `icon` custom) */
  neutral: (message: string, options?: ToastOptions) => toast(message, uiOpts(options)),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
};


import { type ToastActionElement } from '@/components/ui/toast';
import { toast as sonnerToast } from 'sonner';

// Types for toast
type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
};

// Export the toast function from sonner directly
export const toast = sonnerToast;

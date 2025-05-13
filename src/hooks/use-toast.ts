
import { type ToastActionElement } from '@/components/ui/toast';
import { toast as sonnerToast } from 'sonner';

// Types for toast
type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
};

// Create a useToast hook that wraps sonner toast with our API
export function useToast() {
  return {
    toast: (props: ToastProps) => {
      return sonnerToast(props.title as string, {
        description: props.description,
        action: props.action,
        variant: props.variant,
      });
    },
    dismiss: sonnerToast.dismiss,
    // This is mocked to maintain compatibility with components
    // expecting the shadcn/ui toast API
    toasts: [] as any[],
  };
}

// Export the toast function from sonner directly
export const toast = sonnerToast;

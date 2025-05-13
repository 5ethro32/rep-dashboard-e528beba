
import { type ToastActionElement } from '@/components/ui/toast';
import { toast as sonnerToast, type ExternalToast } from 'sonner';

// Types for toast
type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
  duration?: number; // Add duration property to match sonner's API
};

// Create a useToast hook that wraps sonner toast with our API
export function useToast() {
  return {
    toast: (props: ToastProps) => {
      // Convert shadcn/ui toast props to sonner toast props
      const sonnerOptions: ExternalToast = {
        description: props.description,
        action: props.action as any,
        // Pass duration if provided
        ...(props.duration !== undefined ? { duration: props.duration } : {}),
        // Map our variant to sonner's style if destructive
        ...(props.variant === 'destructive' ? { style: { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' } } : {})
      };
      
      return sonnerToast(props.title as string, sonnerOptions);
    },
    dismiss: sonnerToast.dismiss,
    // This is mocked to maintain compatibility with components
    // expecting the shadcn/ui toast API
    toasts: [] as any[],
  };
}

// Create a direct toast function for convenience
// This matches the old API but uses sonner under the hood
export const toast = (props: ToastProps) => {
  const sonnerOptions: ExternalToast = {
    description: props.description,
    action: props.action as any,
    // Pass duration if provided
    ...(props.duration !== undefined ? { duration: props.duration } : {}),
    // Map our variant to sonner's style if destructive
    ...(props.variant === 'destructive' ? { style: { backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' } } : {})
  };
  
  return sonnerToast(props.title as string, sonnerOptions);
};


import { useToast as useShadcnToast } from '@/components/ui/use-toast';
import { ToastActionElement } from '@/components/ui/toast';
import type { ExternalToast } from 'sonner';
import { toast as sonnerToast } from 'sonner';

// Types for shadcn/ui toast
type ToastProps = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
};

// Wrap the shadcn toast functionality
export const useToast = () => {
  const { toast } = useShadcnToast();
  return { toast };
};

// Export the toast function from sonner directly
export const toast = sonnerToast;

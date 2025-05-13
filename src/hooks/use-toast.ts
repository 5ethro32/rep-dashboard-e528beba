
import { useState, useEffect, useRef } from 'react';
import { useToast as useShadcnToast } from '@/components/ui/toast';
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

// Properly implement the useToast hook, using the shadcn toast directly
export const useToast = () => {
  // Use the Shadcn toast directly without causing a circular dependency
  return useShadcnToast();
};

// Export the toast function from sonner directly
export const toast = sonnerToast;

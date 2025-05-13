
// This file re-exports the toast hook and function from our hooks directory
// This allows other components to import from @/components/ui/use-toast
// while the actual implementation is in @/hooks/use-toast.ts

import { toast } from "@/hooks/use-toast";

// Export the toast function from our hooks directory
export { toast };
// Re-export the hook with a different name to avoid circular dependency
export { useToast } from "@/components/ui/toast";

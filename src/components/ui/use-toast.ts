
// This file re-exports the toast hook and function from our hooks directory
// This allows other components to import from @/components/ui/use-toast
// while the actual implementation is in our hooks directory

import { useToast, toast } from "@/hooks/use-toast";

// Export both the toast function and useToast hook
export { useToast, toast };

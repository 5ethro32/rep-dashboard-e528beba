
// This file re-exports the toast hook and function from our hooks directory
// This allows other components to import from @/components/ui/use-toast
// while the actual implementation is in other files

import { toast } from "@/hooks/use-toast";
import { useToast } from "@/components/ui/toast";

// Export both the toast function and useToast hook
export { useToast, toast };

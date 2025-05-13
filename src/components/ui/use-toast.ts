
// This file re-exports the toast hook and function from our hooks directory
// This allows other components to import from @/components/ui/use-toast
// while the actual implementation is in @/hooks/use-toast.ts

import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };

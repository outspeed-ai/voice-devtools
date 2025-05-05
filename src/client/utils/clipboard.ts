import { toast } from "sonner";

/**
 * Copies the given content to the clipboard, and shows a toast notification.
 *
 * @param content - The content to copy to the clipboard.
 */
export const copyToClipboard = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  } catch (err) {
    toast.error("Failed to copy to clipboard");
  }
};

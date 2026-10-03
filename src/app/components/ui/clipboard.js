import { toast } from "@heroui/react";

export async function copyText(text, options = {}) {
  const { successMessage = "Copied to clipboard", toast: showToast = true } =
    typeof options === "string" ? { successMessage: options } : options;

  if (!text) {
    if (showToast) toast.warning("Nothing to copy");
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    if (showToast) toast.success(successMessage);
    return true;
  } catch {
    if (showToast) toast.danger("Could not copy to clipboard");
    return false;
  }
}

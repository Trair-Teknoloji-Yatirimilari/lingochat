import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function useMessageDelete() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = trpc.messages.delete.useMutation();

  const deleteMessage = async (messageId: number) => {
    try {
      setLoading(true);
      setError(null);

      const result = await deleteMutation.mutateAsync({ messageId });

      if (result.success) {
        return true;
      } else {
        setError(result.message || "Mesaj silinemedi");
        return false;
      }
    } catch (err) {
      setError("Mesaj silme hatası");
      console.error("Error deleting message:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    deleteMessage,
  };
}

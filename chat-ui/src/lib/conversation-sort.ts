import { Conversation } from "@/api/models/Conversation";

export type SortOption = "new-to-old" | "old-to-new" | "a-to-z" | "z-to-a";

export const sortConversations = (
  conversations: Conversation[],
  sortOption: SortOption = "new-to-old"
) => {
  const result = [...conversations];

  switch (sortOption) {
    case "new-to-old":
      return result.sort((a, b) => {
        const aTime = new Date(a.updated_at || 0).getTime();
        const bTime = new Date(b.updated_at || 0).getTime();
        return bTime - aTime;
      });
    case "old-to-new":
      return result.sort((a, b) => {
        const aTime = new Date(a.updated_at || 0).getTime();
        const bTime = new Date(b.updated_at || 0).getTime();
        return aTime - bTime;
      });
    case "a-to-z":
      return result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "z-to-a":
      return result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    default:
      return result;
  }
};

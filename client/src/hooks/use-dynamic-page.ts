import { useQuery } from "@tanstack/react-query";
import type { PageLayout, ContentBlock } from "@shared/schema";

interface DynamicPageData {
  layout: PageLayout;
  blocks: ContentBlock[];
}

export function useDynamicPage(slug: string) {
  return useQuery<DynamicPageData>({
    queryKey: ["/api/pages", slug],
    queryFn: async () => {
      const response = await fetch(`/api/pages/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch page layout');
      }
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fallback for when dynamic content is not available
export const defaultFallback = {
  showFallback: true,
  layout: null,
  blocks: []
};
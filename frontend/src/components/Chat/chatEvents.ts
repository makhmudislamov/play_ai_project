export const chatEvents = [
    {
      name: "page-changed",
      when: "When user navigates to a different page",
      data: {
        pageNumber: { type: "number", description: "New page number" },
        pageText: { type: "string", description: "New page content" }
      }
    }
  ] as const;
  
  export type ChatEvent = {
    name: string;
    data: Record<string, any>;
  };
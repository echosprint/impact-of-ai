export const SITE_CONFIG = {
  bookTitle: "AI冲击波：经济需求的坍缩",
  description: "深入探讨人工智能对经济结构的冲击以及需求坍缩现象的分析",
  author: "作者姓名",
  url: "https://your-site-url.com",
  locale: "zh-CN",
} as const;

export type SiteConfig = typeof SITE_CONFIG; 
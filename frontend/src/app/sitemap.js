// Generate sitemap for Next.js
export default function sitemap() {
  return [
    {
      url: 'https://clicksummary.com/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://clicksummary.com/pricing/',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://clicksummary.com/privacy/',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}

/**
 * Configuration constants
 */
export const CONFIG = {
  // API key is NOT needed in the extension - all API calls go through the backend
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  MODELS: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast & efficient' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Balanced' },
  ],
  DEFAULT_MODEL: 'gpt-4o-mini',
  LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
  ],
  DEFAULT_LANGUAGE: 'en',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7,
  MAX_COMMENTS: 50,
};

/**
 * Reddit selectors for different layouts
 */
export const REDDIT_SELECTORS = {
  // New Reddit
  header: 'reddit-header-large, reddit-header-small, header',
  mainContent: 'shreddit-app, #AppRouter-main-content',
  post: 'shreddit-post',
  postTitle: 'h1, [slot="title"]',
  postContent: '[slot="text-body"], [data-test-id="post-content"]',
  postAuthor: '[slot="authorName"], [data-testid="post_author_link"]',
  comments: 'shreddit-comment',
  
  // Old Reddit (fallback)
  oldHeader: '#header',
  oldContent: '.content',
  oldPost: '.thing.link',
  oldPostTitle: '.title',
  oldComments: '.comment',
};

import { RedditThread, RedditComment } from '../types';
import { REDDIT_SELECTORS } from './config';

/**
 * Extract Reddit thread content (post + comments)
 */
export async function extractRedditThread(): Promise<RedditThread> {
  const thread: RedditThread = {
    url: window.location.href,
    title: '',
    postContent: '',
    author: '',
    subreddit: '',
    score: 0,
    comments: [],
  };

  // Extract subreddit from URL
  const subredditMatch = window.location.pathname.match(/\/r\/([\w]+)\//);
  thread.subreddit = subredditMatch ? subredditMatch[1] : '';

  // Extract post title
  const titleElement = 
    document.querySelector<HTMLElement>(REDDIT_SELECTORS.postTitle) ||
    document.querySelector<HTMLElement>('h1');
  
  if (titleElement) {
    thread.title = titleElement.textContent?.trim() || '';
  }

  // Extract post content
  const postElement = 
    document.querySelector<HTMLElement>(REDDIT_SELECTORS.postContent) ||
    document.querySelector<HTMLElement>('[data-test-id="post-content"]') ||
    document.querySelector<HTMLElement>('.Post .md');
  
  if (postElement) {
    thread.postContent = postElement.textContent?.trim() || '';
  }

  // Extract author
  const authorElement = 
    document.querySelector<HTMLElement>(REDDIT_SELECTORS.postAuthor) ||
    document.querySelector<HTMLElement>('[data-testid="post_author_link"]');
  
  if (authorElement) {
    thread.author = authorElement.textContent?.trim() || '';
  }

  // Extract post score
  const scoreElement = document.querySelector<HTMLElement>('[id^="vote-arrows"]');
  if (scoreElement) {
    const scoreText = scoreElement.textContent?.trim() || '0';
    thread.score = parseInt(scoreText.replace(/[^0-9]/g, '')) || 0;
  }

  // Extract comments
  thread.comments = extractComments();

  return thread;
}

/**
 * Extract comments from the thread
 */
function extractComments(): RedditComment[] {
  const comments: RedditComment[] = [];
  
  console.log('🔍 Extracting comments...');
  
  // Try multiple selectors for new Reddit (2024+ layout)
  const commentSelectors = [
    'shreddit-comment',
    '[data-testid="comment"]',
    '[data-type="comment"]',
    'div[id^="t1_"]', // Comment IDs start with t1_
    '.Comment',
    '.comment', // Old Reddit
  ];
  
  let commentElements: NodeListOf<HTMLElement> | HTMLElement[] = document.querySelectorAll<HTMLElement>('shreddit-comment');
  
  // Try each selector until we find comments
  for (const selector of commentSelectors) {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (elements.length > 0) {
      commentElements = elements;
      console.log(`✅ Found ${elements.length} comments using selector: ${selector}`);
      break;
    }
  }
  
  // If still no comments, try to find any element with comment-like content
  if (commentElements.length === 0) {
    console.log('⚠️ No comments found with standard selectors, trying fallback...');
    // Look for elements that might contain comments
    const possibleComments = document.querySelectorAll<HTMLElement>('[slot="comment"], [data-testid*="comment"], .md');
    if (possibleComments.length > 0) {
      console.log(`📝 Found ${possibleComments.length} possible comment elements`);
    }
  }

  let count = 0;
  commentElements.forEach((element) => {
    if (count >= 50) return;

    const comment: RedditComment = {
      author: '',
      content: '',
      score: 0,
      depth: 0,
    };

    // Extract author - try multiple approaches
    const authorEl = 
      element.querySelector<HTMLElement>('[slot="authorName"]') ||
      element.querySelector<HTMLElement>('a[href*="/user/"]') ||
      element.querySelector<HTMLElement>('.author') ||
      element.querySelector<HTMLElement>('[data-testid="comment_author_link"]');
    
    // Also check element attributes
    const authorAttr = element.getAttribute('author');
    
    if (authorAttr) {
      comment.author = authorAttr;
    } else if (authorEl) {
      comment.author = authorEl.textContent?.trim().replace('u/', '') || '';
    }

    // Extract content - try multiple approaches
    const contentEl = 
      element.querySelector<HTMLElement>('[slot="comment"]') ||
      element.querySelector<HTMLElement>('[data-testid="comment"] div[id]') ||
      element.querySelector<HTMLElement>('.md') ||
      element.querySelector<HTMLElement>('.RichTextJSON-root') ||
      element.querySelector<HTMLElement>('p');
    
    if (contentEl) {
      comment.content = contentEl.textContent?.trim() || '';
    } else {
      // Try getting text directly from element if it's a shreddit-comment
      const textContent = element.textContent?.trim() || '';
      // Filter out just the comment text (remove author, score, etc.)
      if (textContent.length > 20) {
        comment.content = textContent;
      }
    }

    // Extract score - try multiple approaches
    const scoreEl = 
      element.querySelector<HTMLElement>('[slot="score"]') ||
      element.querySelector<HTMLElement>('faceplate-number') ||
      element.querySelector<HTMLElement>('.score') ||
      element.querySelector<HTMLElement>('[data-testid="vote-score"]');
    
    // Also check element attribute
    const scoreAttr = element.getAttribute('score');
    
    if (scoreAttr) {
      comment.score = parseInt(scoreAttr) || 0;
    } else if (scoreEl) {
      const scoreText = scoreEl.textContent?.trim() || '0';
      // Handle "1.2k" format
      if (scoreText.includes('k')) {
        comment.score = Math.round(parseFloat(scoreText.replace('k', '')) * 1000);
      } else {
        comment.score = parseInt(scoreText.replace(/[^0-9-]/g, '')) || 0;
      }
    }

    // Determine depth (nesting level)
    const depthAttr = element.getAttribute('depth') || 
                     element.getAttribute('data-depth');
    comment.depth = depthAttr ? parseInt(depthAttr) : 0;

    // Only add if we have meaningful content
    if (comment.content && comment.content.length > 10) {
      comments.push(comment);
      count++;
    }
  });

  console.log(`📊 Extracted ${comments.length} comments total`);
  if (comments.length > 0) {
    console.log('📝 Sample comment:', comments[0]);
  }

  return comments;
}

/**
 * Detect if we're on a Reddit thread page
 */
export function isRedditThreadPage(): boolean {
  const url = window.location.href;
  return /reddit\.com\/r\/[\w]+\/comments\/[\w]+/.test(url);
}

/**
 * Find the post container to inject toolbar above
 */
export function findPostContainer(): HTMLElement | null {
  // Try to find the main post/thread container
  const selectors = [
    'shreddit-post',
    '[data-test-id="post-content"]',
    '.Post',
    'div[id^="t3_"]', // Reddit post IDs start with t3_
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
  }

  return null;
}

/**
 * Find the Reddit header element (legacy - for reference)
 */
export function findRedditHeader(): HTMLElement | null {
  const selectors = [
    'reddit-header-large',
    'reddit-header-small',
    'header[role="banner"]',
    '#header',
    '.header',
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
  }

  return null;
}

/**
 * Find the main content container to inject panel into
 */
export function findMainContent(): HTMLElement | null {
  const selectors = [
    'shreddit-app',
    '#AppRouter-main-content',
    '.content[role="main"]',
    'main',
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      return element;
    }
  }

  return document.body;
}

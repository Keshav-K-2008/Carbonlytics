import dotenv from 'dotenv';
import { cache } from '../config/cache.js';

dotenv.config();

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Curated high-quality environmental articles as fallbacks
const MOCK_NEWS = [
  {
    title: 'Global Solar Generation Reaches Historic Highs in 2026',
    description: 'Renewable energy capacity continues to skyrocket as solar infrastructure installations surpass initial forecast models by 40% this fiscal year.',
    source: { name: 'Energy News Digest' },
    url: 'https://example.com/solar-high',
    urlToImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    publishedAt: new Date().toISOString().slice(0, 10),
  },
  {
    title: 'Circular Economy Strategies Divert 5 Million Tons of Waste',
    description: 'New industrial policy and standardizations on compostable packagings allow international shipping hubs to drastically cut back on landfill waste deposits.',
    source: { name: 'Eco-Sentinel' },
    url: 'https://example.com/circular-waste',
    urlToImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  },
  {
    title: 'How Diet Swaps Can Drastically Lower Household Footprints',
    description: 'A comprehensive study highlights how removing red meat from family meals even three days a week has a massive water and carbon offset benefit.',
    source: { name: 'Sustain Science Review' },
    url: 'https://example.com/diet-swaps',
    urlToImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  },
  {
    title: 'Ocean Reforestation: The Role of Kelp Forests in Carbon Sequestration',
    description: 'Scientists are launching new pilot programs to restore sea kelp beds, which can lock away carbon dioxide up to 20 times faster than land forests.',
    source: { name: 'Marine Biology Focus' },
    url: 'https://example.com/kelp-forests',
    urlToImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  }
];

export class NewsService {
  /**
   * Fetches latest climate news articles
   * @returns {Promise<Array>}
   */
  static async getClimateNews() {
    const cacheKey = 'climate_news';
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    if (!NEWS_API_KEY || NEWS_API_KEY === 'your_news_api_key_here') {
      // Cache mock news for 60 minutes
      cache.set(cacheKey, MOCK_NEWS, 60 * 60 * 1000);
      return MOCK_NEWS;
    }

    try {
      const queryStr = encodeURIComponent('sustainability OR "climate change" OR "green energy" OR "carbon footprint"');
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${queryStr}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`NewsAPI responded with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'ok' && Array.isArray(result.articles) && result.articles.length > 0) {
        // Filter out broken articles without images or titles
        const cleanArticles = result.articles
          .filter(art => art.title && art.description && art.urlToImage)
          .map(art => ({
            title: art.title,
            description: art.description,
            source: { name: art.source?.name || 'News Source' },
            url: art.url,
            urlToImage: art.urlToImage,
            publishedAt: art.publishedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          }));

        // Cache for 60 minutes
        cache.set(cacheKey, cleanArticles, 60 * 60 * 1000);
        return cleanArticles;
      }

      // If response was ok but articles empty, cache mock news for 5 mins
      cache.set(cacheKey, MOCK_NEWS, 5 * 60 * 1000);
      return MOCK_NEWS;
    } catch (error) {
      console.error('Failed to fetch climate news, using mock articles:', error);
      // Cache mock news for 5 minutes during failure state
      cache.set(cacheKey, MOCK_NEWS, 5 * 60 * 1000);
      return MOCK_NEWS;
    }
  }
}

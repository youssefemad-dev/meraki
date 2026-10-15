export class TMDBClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes
  private readonly maxCacheSize = 100; // Limit cache size to prevent memory leaks

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
    // Create a cache key from endpoint and params
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;

    // Check if we have a cached response that's still valid
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
      return cached.data;
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const result = await response.json();

    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    // Limit cache size to prevent memory leaks
    if (this.cache.size > this.maxCacheSize) {
      // Remove the oldest entry
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    return result;
  }

  async fetchDiscoverMovies(genreIds: number[], options: { page?: number } = {}): Promise<any[]> {
    const params: Record<string, string | number | boolean> = {
      with_genres: genreIds.join(','),
      sort_by: 'popularity.desc',
      page: options.page ?? 1
    };

    const response = await this.fetch<{ results: any[] }>('/discover/movie', params);
    return response.results;
  }

  async fetchPopularMovies(options: { page?: number } = {}): Promise<any[]> {
    const params: Record<string, string | number | boolean> = {
      sort_by: 'popularity.desc',
      page: options.page ?? 1
    };

    const response = await this.fetch<{ results: any[] }>('/movie/popular', params);
    return response.results;
  }

  async fetchTopRatedMovies(options: { page?: number } = {}): Promise<any[]> {
    const params: Record<string, string | number | boolean> = {
      sort_by: 'vote_average.desc',
      page: options.page ?? 1
    };

    const response = await this.fetch<{ results: any[] }>('/movie/top_rated', params);
    return response.results;
  }

  /**
   * Clear the internal cache
   * Useful for debugging or forcing fresh data
   */
  clearCache(): void {
    this.cache.clear();
  }

  async fetchMovieDetails(movieId: number): Promise<any> {
    return this.fetch(`/movie/${movieId}`);
  }
}
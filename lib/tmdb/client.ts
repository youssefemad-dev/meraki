export class TMDBClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.themoviedb.org/3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    return response.json();
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

  async fetchMovieDetails(movieId: number): Promise<any> {
    return this.fetch(`/movie/${movieId}`);
  }
}
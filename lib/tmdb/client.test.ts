import { TMDBClient } from './client';

describe('TMDBClient', () => {
  let client: TMDBClient;

  beforeEach(() => {
    // Mock the fetch API
    global.fetch = jest.fn();
    client = new TMDBClient('test-api-key');
  });

  it('should fetch discover movies with genre filters', async () => {
    const mockResponse = {
      results: [
        { id: 1, title: 'Test Movie', overview: 'Test overview', genre_ids: [28, 12] },
        { id: 2, title: 'Test Movie 2', overview: 'Test overview 2', genre_ids: [35] }
      ],
      total_results: 2,
      page: 1,
      total_pages: 1
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await client.fetchDiscoverMovies([28, 12], { page: 1 });
    expect(result).toEqual(mockResponse.results);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/discover/movie?api_key=test-api-key&with_genres=28%2C12&sort_by=popularity.desc&page=1'
    );
  });

  it('should handle API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(client.fetchDiscoverMovies([28])).rejects.toThrow('TMDB API error: 500');
  });
});
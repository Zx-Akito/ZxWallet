// Web search through a self-hosted SearXNG instance (JSON output must be enabled in its settings.yml).
const SEARXNG_URL = process.env.SEARXNG_URL;

export type SearchResult = { title: string; url: string; content: string };

export async function searchWeb(query: string, limit = 5): Promise<SearchResult[]> {
  if (!SEARXNG_URL) {
    console.error('SearXNG belum dikonfigurasi: set SEARXNG_URL di .env');
    return [];
  }

  try {
    const url = `${SEARXNG_URL.replace(/\/$/, '')}/search?q=${encodeURIComponent(query)}&format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      console.error(`SearXNG Error (${response.status}):`, await response.text());
      return [];
    }

    const data = await response.json();
    return (data.results || []).slice(0, limit).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || ''
    }));
  } catch (err: any) {
    console.error('Failed to call SearXNG:', err.message);
    return [];
  }
}

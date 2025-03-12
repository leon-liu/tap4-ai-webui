/* eslint-disable no-template-curly-in-string */
type CrawlerRequest = {
  url: string;
  tags: string[];
  callback_url: string;
  key: string;
};

type CrawlerResponse = {
  code: number;
  msg: string;
  data: any | null;
};

// type CrawlerData = {
//   description: string;
//   detail: string;
//   languages: string[];
//   name: string;
//   screenshot_data: string;
//   screenshot_thumbnail_data: string;
//   tags: string[] | null;
//   title: string;
//   url: string;
// };

export default async function crawler({ url, tags, callback_url, key }: CrawlerRequest) {
  const crawlerKey = process.env.CRAWLER_API_KEY;
  console.log(crawlerKey, url, tags, callback_url, key, process.env.CRAWLER_API);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const res = await fetch(process.env.CRAWLER_API!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${crawlerKey}`,
      },
      body: JSON.stringify({
        url,
        tags,
        callback_url,
        key,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('Crawler response status:', res.status);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data as CrawlerResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          code: 504,
          msg: `Request timeout after 30 seconds for URL: ${url}`,
          data: null,
        } as CrawlerResponse;
      }
      return {
        code: 500,
        msg: error.message,
        data: null,
      } as CrawlerResponse;
    }
    return {
      code: 500,
      msg: 'Unknown error occurred',
      data: null,
    } as CrawlerResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

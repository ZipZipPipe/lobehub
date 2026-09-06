import type {
  SearchParams,
  SearchQuery,
  UniformSearchResponse,
  UniformSearchResult,
} from '@lobechat/types';
import type { Crawler, CrawlImplType, CrawlUniformResult } from '@lobechat/web-crawler';
import debug from 'debug';
import pMap from 'p-map';

import { toolsEnv } from '@/envs/tools';

import { type SearchImplType, type SearchServiceImpl } from './impls';
import { createSearchServiceImpl } from './impls';

const DEFAULT_CRAWL_CONCURRENCY = 3;
const DEFAULT_CRAWLER_RETRY = 1;
const SEARCH_PROVIDERS_FAILED =
  'Web search failed because all configured providers returned errors';
const log = debug('lobe-oom:web-browsing:search-service');

const parseImplEnv = (envString: string = '') => {
  // Handle full-width commas and extra whitespace
  const envValue = envString.replaceAll('，', ',').trim();
  return envValue
    .split(',')
    .map((impl) => impl.trim())
    .filter(Boolean);
};

const buildSearchParams = ({
  searchCategories,
  searchEngines,
  searchTimeRange,
}: SearchParams): SearchParams | undefined => {
  const params: SearchParams = {};

  if (searchCategories?.length) {
    params.searchCategories = searchCategories;
  }

  if (searchEngines?.length) {
    params.searchEngines = searchEngines;
  }

  if (searchTimeRange && searchTimeRange !== 'anytime') {
    params.searchTimeRange = searchTimeRange;
  }

  return Object.keys(params).length > 0 ? params : undefined;
};

const getMemorySnapshot = () => {
  if (typeof process === 'undefined' || typeof process.memoryUsage !== 'function') {
    return 'non-node';
  }

  const { heapUsed, rss } = process.memoryUsage();

  return `rss=${(rss / 1024 / 1024).toFixed(1)}MB heap=${(heapUsed / 1024 / 1024).toFixed(1)}MB`;
};

/**
 * Search service class
 * Uses different implementations for different search operations
 */
export class SearchService {
  private searchImpList: SearchServiceImpl[];

  private get crawlerImpls() {
    return parseImplEnv(toolsEnv.CRAWLER_IMPLS);
  }

  private get crawlConcurrency() {
    return toolsEnv.CRAWL_CONCURRENCY ?? DEFAULT_CRAWL_CONCURRENCY;
  }

  private get crawlerRetry() {
    return toolsEnv.CRAWLER_RETRY ?? DEFAULT_CRAWLER_RETRY;
  }

  constructor() {
    const impls = this.searchImpls;
    this.searchImpList =
      impls.length > 0
        ? impls.map((impl) => createSearchServiceImpl(impl))
        : [createSearchServiceImpl()];
  }

  async crawlPages(input: { impls?: CrawlImplType[]; urls: string[] }) {
    try {
      if (log.enabled) {
        log(
          'crawlPages:start urls=%d impls=%s mem=%s',
          input.urls.length,
          (input.impls || this.crawlerImpls).join(',') || '-',
          getMemorySnapshot(),
        );
      }
    } catch {}

    const { Crawler } = await import('@lobechat/web-crawler');
    const crawler = new Crawler({ impls: this.crawlerImpls });

    const results = await pMap(
      input.urls,
      async (url) => {
        return await this.crawlWithRetry(crawler, url, input.impls);
      },
      { concurrency: this.crawlConcurrency },
    );

    return { results };
  }

  private async crawlWithRetry(
    crawler: Crawler,
    url: string,
    impls?: CrawlImplType[],
  ): Promise<CrawlUniformResult> {
    const maxAttempts = this.crawlerRetry + 1;
    let lastResult: CrawlUniformResult | undefined;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await crawler.crawl({ impls, url });
        try {
          if (log.enabled) {
            log('crawlWithRetry:result crawler=%s mem=%s', result.crawler, getMemorySnapshot());
          }
        } catch {}
        lastResult = result;

        if (!this.isFailedCrawlResult(result)) {
          return result;
        }

        // Dead link / invalid URL / resource file / rejected request: a retry is the
        // same billed request with the same authoritative answer.
        if (!this.isRetryableCrawlResult(result)) {
          return result;
        }
      } catch (error) {
        lastError = error as Error;
      }
    }

    if (lastResult) {
      return lastResult;
    }

    return {
      crawler: 'unknown',
      data: {
        content: `Fail to crawl the page. Error type: ${lastError?.name || 'UnknownError'}, error message: ${lastError?.message}`,
        errorMessage: lastError?.message,
        errorType: lastError?.name || 'UnknownError',
      },
      originalUrl: url,
    };
  }

  /**
   * A successful crawl result always includes `contentType` (e.g. 'text', 'json')
   * in `result.data`, while a failed result contains `errorType`/`errorMessage` instead.
   */
  private isFailedCrawlResult(result: CrawlUniformResult): boolean {
    return !('contentType' in result.data);
  }

  private isRetryableCrawlResult(result: CrawlUniformResult): boolean {
    return !('retryable' in result.data) || result.data.retryable !== false;
  }

  private get searchImpls() {
    return parseImplEnv(toolsEnv.SEARCH_PROVIDERS) as SearchImplType[];
  }

  /**
   * Query for search results using the specified impl
   */
  private async queryWithImpl(impl: SearchServiceImpl, query: string, params?: SearchParams) {
    try {
      return await impl.query(query, params);
    } catch (e) {
      console.error('[SearchService] query failed', {
        provider: impl.constructor.name || 'UnknownSearchImpl',
      });
      return {
        costTime: 0,
        errorDetail: (e as Error).message,
        query,
        resultNumbers: 0,
        results: [],
      };
    }
  }

  private async queryProvider(
    impl: SearchServiceImpl,
    query: string,
    params: SearchParams,
  ): Promise<UniformSearchResponse | undefined> {
    let currentParams = buildSearchParams({
      searchCategories: params.searchCategories,
      searchEngines: impl.useAutoSearchEngineSelection ? undefined : params.searchEngines,
      searchTimeRange: params.searchTimeRange,
    });
    let lastSuccessfulEmpty: UniformSearchResponse | undefined;

    while (true) {
      const data = await this.queryWithImpl(impl, query, currentParams);

      if (data.errorDetail) return undefined;
      if (data.results.length > 0) return data;

      lastSuccessfulEmpty = data;

      if (currentParams?.searchEngines?.length) {
        currentParams = buildSearchParams({
          searchCategories: params.searchCategories,
          searchTimeRange: params.searchTimeRange,
        });
        continue;
      }

      if (currentParams) {
        currentParams = undefined;
        continue;
      }

      return lastSuccessfulEmpty;
    }
  }

  private mergeSearchResponses(
    query: string,
    responses: UniformSearchResponse[],
  ): UniformSearchResponse {
    if (responses.length === 1) return responses[0];

    const results: UniformSearchResult[] = [];
    const resultIndexByUrl = new Map<string, number>();
    const maxResultCount = Math.max(0, ...responses.map((response) => response.results.length));

    // Interleave provider results so one noisy provider cannot crowd every
    // other source out of the 30-item prompt limit used by the web tool.
    for (let resultIndex = 0; resultIndex < maxResultCount; resultIndex++) {
      for (const response of responses) {
        const result = response.results[resultIndex];
        if (!result) continue;

        const resultKey = this.normalizeResultUrl(result.url);
        const existingIndex = resultIndexByUrl.get(resultKey);

        if (existingIndex === undefined) {
          resultIndexByUrl.set(resultKey, results.length);
          results.push({ ...result, engines: [...result.engines] });
          continue;
        }

        const existing = results[existingIndex];
        results[existingIndex] = {
          ...existing,
          content: existing.content || result.content,
          engines: [...new Set([...existing.engines, ...result.engines])],
          imgSrc: existing.imgSrc || result.imgSrc,
          publishedDate: existing.publishedDate || result.publishedDate,
          thumbnail: existing.thumbnail || result.thumbnail,
        };
      }
    }

    return {
      costTime: Math.max(0, ...responses.map((response) => response.costTime)),
      query,
      resultNumbers: results.length,
      results,
    };
  }

  private normalizeResultUrl(url: string) {
    try {
      const normalized = new URL(url);
      normalized.hash = '';

      const retainedSearchParams = new URLSearchParams();
      normalized.searchParams.forEach((value, key) => {
        if (!key.toLowerCase().startsWith('utm_')) retainedSearchParams.append(key, value);
      });
      normalized.search = retainedSearchParams.toString();

      return normalized.toString().replace(/\/$/, '');
    } catch {
      return url.trim().replace(/\/$/, '');
    }
  }

  /**
   * Query for search results (uses the first provider)
   */
  async query(query: string, params?: SearchParams) {
    return this.queryWithImpl(this.searchImpList[0], query, params);
  }

  async webSearch({ query, searchCategories, searchEngines, searchTimeRange }: SearchQuery) {
    try {
      if (log.enabled) {
        log(
          'webSearch:start providers=%d q=%d c=%d e=%d mem=%s',
          this.searchImpList.length,
          query.length,
          searchCategories?.length || 0,
          searchEngines?.length || 0,
          getMemorySnapshot(),
        );
      }
    } catch {}

    const responses = await Promise.all(
      this.searchImpList.map((impl) => {
        try {
          if (log.enabled) {
            log(
              'webSearch:impl impl=%s mem=%s',
              impl.constructor.name || 'UnknownSearchImpl',
              getMemorySnapshot(),
            );
          }
        } catch {}

        return this.queryProvider(impl, query, {
          searchCategories,
          searchEngines,
          searchTimeRange,
        });
      }),
    );
    const successfulResponses = responses.filter(
      (response): response is UniformSearchResponse => response !== undefined,
    );

    if (successfulResponses.length > 0) {
      return this.mergeSearchResponses(query, successfulResponses);
    }

    return {
      costTime: 0,
      errorDetail: SEARCH_PROVIDERS_FAILED,
      query,
      resultNumbers: 0,
      results: [],
    };
  }
}

// Add a default exported instance for convenience
export const searchService = new SearchService();

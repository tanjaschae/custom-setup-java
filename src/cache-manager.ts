import * as core from '@actions/core';
import * as cache from '@actions/cache';

export async function restoreFromCache(cacheKey: string): Promise<boolean> {
    const runnerToolCache = process.env.RUNNER_TOOL_CACHE || '/tmp';
    const toolDir = `${runnerToolCache}/${cacheKey}`;

    if (await cache.restoreCache([toolDir], cacheKey)) {
        core.info(`Restored cache for key: ${cacheKey}`);
        return true;
    }

    return false;
}

export async function saveToCache(cacheKey: string, directory: string): Promise<void> {
    await cache.saveCache([directory], cacheKey);
    core.info(`Saved to cache with key: ${cacheKey}`);
}
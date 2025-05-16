import * as core from "@actions/core";
import path from "node:path";
import * as cache from "@actions/cache";

export async function restoreFromCache(cacheKey: string): Promise<{cacheHit: boolean, toolDir: string}> {
    const runnerToolCache = process.env.RUNNER_TOOL_CACHE || '/tmp';
    core.info(`Directory where tools are cached: ${runnerToolCache}`);

    const toolDir = path.join(runnerToolCache, cacheKey);

    // Try to restore from cache
    let cacheHit = false;
    if (await cache.restoreCache([toolDir], cacheKey)) {
        cacheHit = true;
        core.info(`Restored cache for key: ${toolDir}`);
    }
    return {cacheHit, toolDir};
}

export async function saveToCache(cacheKey: string, directory: string): Promise<void> {
    // Save to cache
    await cache.saveCache([directory], cacheKey);
    core.info(`Saved to cache with key: ${cacheKey}`);
}

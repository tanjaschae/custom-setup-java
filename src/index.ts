import * as core from '@actions/core';
import { validateInputs } from './input-validation';
import { restoreFromCache, saveToCache } from './cache-manager';
import { downloadAndExtractJava, setEnvironment } from './java-utils';

async function run(): Promise<void> {
    try {
        const { version, distribution, pkg } = validateInputs();
        const cacheKey = `java-${distribution}-${version}-${pkg}`;
        if (await restoreFromCache(cacheKey)) {
            core.info('Java restored from cache.');
        } else {
            const toolDir = await downloadAndExtractJava(distribution, version, pkg);
            await saveToCache(cacheKey, toolDir);
            setEnvironment(toolDir);
        }
    } catch (error) {
        core.setFailed(error instanceof Error ? error.message : 'An unknown error occurred');
    }
}

run();
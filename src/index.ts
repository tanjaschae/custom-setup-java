import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {validateInputs} from "./inputs-validator";

import {downloadAndExtractJava, setEnvironment} from "./java-utils";
import {restoreFromCache, saveToCache} from "./cache-manager";

async function run(): Promise<void> {

    try {
        const {version, distribution, pkg} = validateInputs();

        const cacheKey = `java-${distribution}-${version}-${pkg}`;

        const result = await restoreFromCache(cacheKey)
        if (result.cacheHit) {
            setEnvironment(result.toolDir);
        } else {
            const extractPath = await downloadAndExtractJava(distribution, version, pkg, result.toolDir)
            await saveToCache(cacheKey, extractPath);

            setEnvironment(extractPath);
        }

        core.setOutput('distribution', distribution)
        core.setOutput('version', version)

        await exec.exec('java', ['-version']);
        core.info('Java is set up and verified.');

    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();

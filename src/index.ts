import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {validateInputs} from "./inputs-validator";

import {downloadAndExtractJava, setEnvironment} from "./java-utils";
import {restoreFromCache, saveToCache} from "./cache-manager";
import {generateRootCA, importRootCA, listJavaTruststore} from "./truststore-manager";

async function run(): Promise<void> {

    try {
        // helper for tests only
        const ca = await generateRootCA();

        const {version, distribution, pkg} = validateInputs();

        const cacheKey = `java-${distribution}-${version}-${pkg}`;

        const result = await restoreFromCache(cacheKey)
        let javaHome = setEnvironment(result.toolDir);
        if (!result.cacheHit) {
            const extractPath = await downloadAndExtractJava(distribution, version, pkg, result.toolDir)
            await saveToCache(cacheKey, extractPath);

            javaHome = setEnvironment(extractPath);
        }

        const truststorePath = await importRootCA(ca.cert);
        await listJavaTruststore(truststorePath, "changeit");

        core.setOutput('path', javaHome);
        core.setOutput('distribution', distribution);
        core.setOutput('version', version);

        await exec.exec('java', ['-version']);
        core.info('Java is set up and verified.');

    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

run();

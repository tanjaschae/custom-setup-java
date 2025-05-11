import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as cache from '@actions/cache';
import * as exec from '@actions/exec';
import {isAllowed} from "./allowedInput";
import path from "node:path";
import * as fs from "node:fs";

async function run(): Promise<void> {

    try {
        const version = core.getInput('java-version')
        const distribution = core.getInput('distribution', {required: true})
        const pkg = core.getInput('java-package')

        if (isAllowed(version, "version") && isAllowed(distribution, "distribution") && isAllowed(pkg, "package")) {
            core.info(`${version.toUpperCase()} ${distribution.toUpperCase()} ${pkg.toUpperCase()} is a valid input`);

            const os = process.env.RUNNER_OS;
            core.info(`Directory where tools are cached: ${process.env.RUNNER_TOOL_CACHE}`);
            core.info(`Path to the checked-out repo: ${process.env.GITHUB_WORKSPACE}`);

            const cacheKey = `java-${distribution}-${version}-${pkg}`;
            const toolDir = path.join(process.env['RUNNER_TOOL_CACHE'] || '/tmp', cacheKey);
            // Try to restore from cache
            const cacheHit = await cache.restoreCache([toolDir], cacheKey);

            if (cacheHit) {
                core.info(`Restored Java from cache: ${toolDir}`);
            } else {
                // Download and extract
                const downloadUrl = getDownloadUrl(distribution, version, pkg)
                core.info(`Download URL: ${downloadUrl}`);
                const archivePath = await tc.downloadTool(downloadUrl)
                const extractPath = await tc.extractTar(archivePath, toolDir);
                core.info(`Java extracted to ${extractPath}`);
                // Save to cache
                await cache.saveCache([toolDir], cacheKey);
                core.info(`Cached Java at key: ${cacheKey}`);
            }

            // Point JAVA_HOME to the extracted folder (assumes single folder inside)
            const javaHome = fs.readdirSync(toolDir).length === 1
                ? path.join(toolDir, fs.readdirSync(toolDir)[0])
                : toolDir;

            core.exportVariable('JAVA_HOME', javaHome);
            core.addPath(path.join(javaHome, 'bin'));

            await exec.exec('java', ['-version']);
            core.info('Java is set up and verified.');

        } else {
            core.info(`${version.toUpperCase()} ${distribution.toUpperCase()} ${pkg.toUpperCase()} is not a valid input`);
        }
        core.notice(`First try with ${version} ${distribution} ${pkg}`);

        core.setOutput('distribution', distribution)
        core.setOutput('version', version)
        core.setOutput('path', "java/home/path")
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

function getDownloadUrl(
    distribution: string,
    version: string,
    pkg: string
): string {
    switch (distribution) {
        case 'temurin':
            return `https://api.adoptium.net/v3/binary/latest/${version}/ga/linux/x64/${pkg}/hotspot/normal/eclipse`;
        case 'zulu':
            return `https://cdn.azul.com/zulu/bin/zulu${version}-ca-${pkg}.tar.gz`;
        case 'oracle':
            throw new Error('Oracle JDK requires manual license acceptance and cannot be downloaded directly.');
        default:
            throw new Error(`Unsupported distribution: ${distribution}`);
    }
}


run();




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
            core.info(`toolDir: ${toolDir}`);
            // /opt/hostedtools/java-zulu-21-jdk

            // Try to restore from cache
            const cacheHit = await cache.restoreCache([toolDir], cacheKey);

            if (cacheHit) {
                core.info(`Restored Java from cache: ${toolDir}`);
                setEnvironment(toolDir);
            } else {
                // Download and extract
                const downloadUrl = getDownloadUrl(distribution, version, pkg)
                core.info(`Download URL: ${downloadUrl}`);
                const archivePath = await downloadJava(downloadUrl, toolDir);
                core.info(`archivePath: ${archivePath}`);
                // const extractPath = await tc.extractTar(archivePath, toolDir);
                const extractPath = await extractArchive(archivePath, toolDir);


                core.info(`Java extracted to ${extractPath}`);
                await exec.exec('ls', ['-la', extractPath]);
                // Save to cache
                await cache.saveCache([extractPath], cacheKey);
                core.info(`Cached Java at key: ${cacheKey}`);

                setEnvironment(extractPath);
            }


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

function setEnvironment(dir: string) {
    // Point JAVA_HOME to the extracted folder (assumes single folder inside)
    const javaHome = fs.readdirSync(dir).length === 1
        ? path.join(dir, fs.readdirSync(dir)[0])
        : dir;

    core.exportVariable('JAVA_HOME', javaHome);
    core.addPath(path.join(javaHome, 'bin'));
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
            return `https://cdn.azul.com/zulu/bin/zulu${version}.42.19-ca-${pkg}${version}.0.7-linux_x64.tar.gz`;
        case 'oracle':
            throw new Error('Oracle JDK requires manual license acceptance and cannot be downloaded directly.');
        default:
            throw new Error(`Unsupported distribution: ${distribution}`);
    }
}

async function extractArchive(archivePath: string, toolDir: string): Promise<string> {
    const ext = path.extname(archivePath).toLowerCase();
    const lowerPath = archivePath.toLowerCase();

    switch (true) {
        case lowerPath.endsWith('.tar.gz'):
        case lowerPath.endsWith('.tgz'):
            // return await tc.extractTar(archivePath, toolDir);
            return await tc.extractTar(archivePath);

        case ext === '.zip':
            return await tc.extractZip(archivePath, toolDir);

        default:
            throw new Error(`Unsupported archive format: ${ext}`);
    }
}

async  function downloadJava(downloadUrl: string, toolDir: string): Promise<string> {
    const extension = getArchiveExtension(downloadUrl);
    const tempFile = path.join(toolDir, `java-${Date.now()}${extension}`);
    const downloadPath = await tc.downloadTool(downloadUrl, tempFile);
    core.info(`Download into ${downloadPath}`);
    exec.exec("ls", ["-la", downloadPath]);
    return downloadPath;
}

function getArchiveExtension(url: string): string {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.endsWith('.tar.gz')) return '.tar.gz';
    if (lowerUrl.endsWith('.tgz')) return '.tgz';
    if (lowerUrl.endsWith('.zip')) return '.zip';
    if (lowerUrl.endsWith('.tar')) return '.tar';

    throw new Error(`Unsupported archive type in URL: ${url}`);
}


run();




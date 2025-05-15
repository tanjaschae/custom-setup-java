import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as cache from '@actions/cache';
import * as exec from '@actions/exec';
import {isAllowed} from "./allowedInput";
import path from "node:path";
import * as fs from "node:fs";
import { promises as fsPromises } from 'fs';

async function run(): Promise<void> {

    try {
        const version = core.getInput('java-version')
        const distribution = core.getInput('distribution', {required: true})
        const pkg = core.getInput('java-package')

        if (isAllowed(version, "version") && isAllowed(distribution, "distribution") && isAllowed(pkg, "package")) {
            core.info(`${version.toUpperCase()} ${distribution.toUpperCase()} ${pkg.toUpperCase()} is a valid input`);

            const os = process.env.RUNNER_OS;
            const runnerToolCache = process.env.RUNNER_TOOL_CACHE || '/tmp';
            core.info(`Directory where tools are cached: ${runnerToolCache}`);

            const cacheKey = `java-${distribution}-${version}-${pkg}`;
            const toolDir = path.join(runnerToolCache, cacheKey);
            core.info(`toolDir: ${toolDir}`);

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
                const extractPath = await extractArchive(archivePath, toolDir);


                core.info(`Java extracted to ${extractPath}`);
                await exec.exec('ls', ['-la', extractPath]);

                await fsPromises.unlink(archivePath);
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

function setEnvironment(dir: string): void {
    const determineJavaHome = (folderPath: string): string => {
        const subDirectories = fs.readdirSync(folderPath);
        return subDirectories.length === 1 ? path.join(folderPath, subDirectories[0]) : folderPath;
    };

    const javaHomePath = determineJavaHome(dir);
    core.exportVariable('JAVA_HOME', javaHomePath);
    core.addPath(path.join(javaHomePath, 'bin'));
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
            // return `https://cdn.azul.com/zulu/bin/zulu${version}.42.19-ca-${pkg}${version}.0.7-linux_x64.tar.gz`;
            return `https://cdn.azul.com/zulu/bin/zulu${version}.80.21-ca-${pkg}${version}.0.27-linux_x64.tar.gz`
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
            return await tc.extractTar(archivePath, toolDir);

        case ext === '.zip':
            return await tc.extractZip(archivePath, toolDir);

        default:
            throw new Error(`Unsupported archive format: ${ext}`);
    }
}

/**
 * Downloads a Java archive from the given URL into the specified directory.
 * @param downloadUrl - The URL to download the Java archive.
 * @param toolDir - The directory to which the Java archive will be temporarily stored.
 * @returns The path to the downloaded file.
 * @throws Error if the download fails or the archive type is unsupported.
 */
async function downloadJava(downloadUrl: string, toolDir: string): Promise<string> {
    // Ensure the download URL is valid
    try {
        new URL(downloadUrl);
    } catch {
        throw new Error(`Invalid URL provided: ${downloadUrl}`);
    }

    // Determine the archive file extension
    let extension: string;
    try {
        extension = getArchiveExtension(downloadUrl);
    } catch (err) {
        core.setFailed(`Unsupported archive extension in URL: ${downloadUrl}`);
        throw err;
    }

    // Temporary file path
    const tempFile = path.join(toolDir, `java-${Date.now()}${extension}`);
    core.info(`Downloading file to: ${tempFile}`);

    let downloadPath = '';
    try {
        downloadPath = await tc.downloadTool(downloadUrl, tempFile);
        core.info(`Download successful: ${downloadPath}`);
    } catch (err) {
        core.setFailed(`Failed to download file from ${downloadUrl}: ${(err as Error).message}`);
        throw err;
    }

    // Validate the file exists and log its details
    try {
        const exitCode: Number = await exec.exec('ls', ['-la', downloadPath]);
        if (exitCode !== 0) {
            throw new Error(`Download file does not exist or is inaccessible: ${downloadPath}`);
        }
    } catch (err) {
        core.setFailed(`Error during file verification: ${(err as Error).message}`);
        throw err;
    }

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




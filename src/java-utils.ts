import path from "node:path";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import fs from "node:fs";
import { promises as fsPromises } from 'fs';

export async function downloadAndExtractJava(
    distribution: string,
    version: string,
    pkg: string,
    toolDir: string
): Promise<string> {

    const downloadUrl = getDownloadUrl(distribution, version, pkg);
    core.info(`Download URL: ${downloadUrl}`);

    const archivePath = await downloadJava(downloadUrl, toolDir );
    const extractPath = await extractArchive(archivePath, toolDir);
    core.info(`Java extracted to ${extractPath}`);

    // check with ls -la
    await exec.exec('ls', ['-la', extractPath]);
    // remove tar.gz or zip files
    await fsPromises.unlink(archivePath);

    return extractPath
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



/**
 * Downloads a Java archive from the given URL into the specified directory.
 * @param downloadUrl - The URL to download the Java archive.
 * @param toolDir - The directory to which the Java archive will be temporarily stored.
 * @returns The path to the downloaded file.
 * @throws Error if the download fails or the archive type is unsupported.
 */
async function downloadJava(downloadUrl: string, toolDir: string): Promise<string> {
    let archivePath = '';
    try {
        const extension = getArchiveExtension(downloadUrl);
        const tempFile = path.join(toolDir, `java-${Date.now()}${extension}`);
        core.info(`Downloading file to: ${tempFile}`);

        archivePath = await tc.downloadTool(downloadUrl, tempFile);
        core.info(`Download successful: ${archivePath}`);

    } catch (err)  {
        core.setFailed(`Error during downloading java: ${(err as Error).message}`);
        throw err;
    }

    // Validate the file exists and log its details
    const exitCode: Number = await exec.exec('ls', ['-la', archivePath]);
    if (exitCode !== 0) {
        throw new Error(`Download file does not exist or is inaccessible: ${archivePath}`);
    }

    return archivePath;
}

function getArchiveExtension(url: string): string {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.endsWith('.tar.gz')) return '.tar.gz';
    if (lowerUrl.endsWith('.tgz')) return '.tgz';
    if (lowerUrl.endsWith('.zip')) return '.zip';
    if (lowerUrl.endsWith('.tar')) return '.tar';

    throw new Error(`Unsupported archive type in URL: ${url}`);
}

async function extractArchive(archivePath: string, toolDir: string): Promise<string> {
    const ext = path.extname(archivePath).toLowerCase();
    const lowerPath = archivePath.toLowerCase();

    switch (true) {
        case lowerPath.endsWith('.tar.gz'):
        case lowerPath.endsWith('.tgz'):
            return await tc.extractTar(archivePath, toolDir);

        case ext === '.zip':
            return await tc.extractZip(archivePath, toolDir);

        default:
            throw new Error(`Unsupported archive format: ${ext}`);
    }
}

export function setEnvironment(dir: string) {
    // Point JAVA_HOME to the extracted folder (assumes single folder inside)
    const javaHome = fs.readdirSync(dir).length === 1
        ? path.join(dir, fs.readdirSync(dir)[0])
        : dir;

    core.exportVariable('JAVA_HOME', javaHome);
    core.addPath(path.join(javaHome, 'bin'));

    core.setOutput('path', javaHome)
}

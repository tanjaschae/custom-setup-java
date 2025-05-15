import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import path from 'node:path';
import fs from "node:fs";

export async function downloadAndExtractJava(
    distribution: string,
    version: string,
    pkg: string
): Promise<string> {
    const downloadUrl = getDownloadUrl(distribution, version, pkg);
    core.info(`Downloading Java from: ${downloadUrl}`);

    const archivePath = await downloadJava(downloadUrl);
    core.info(`Extracting Java from: ${archivePath}`);

    return await extractArchive(archivePath);
}

function getDownloadUrl(distribution: string, version: string, pkg: string): string {
    switch (distribution) {
        case 'temurin':
            return `https://api.adoptium.net/v3/binary/latest/${version}/ga/linux/x64/${pkg}/hotspot/normal/eclipse`;
        case 'zulu':
            return `https://cdn.azul.com/zulu/bin/zulu${version}.80.21-ca-${pkg}${version}.0.27-linux_x64.tar.gz`;
        case 'oracle':
            throw new Error('Oracle JDK requires manual license acceptance and cannot be downloaded directly.');
        default:
            throw new Error(`Unsupported distribution: ${distribution}`);
    }
}

async function downloadJava(url: string): Promise<string> {
    const tempPath = await tc.downloadTool(url);
    core.info(`Java downloaded to: ${tempPath}`);
    return tempPath;
}

async function extractArchive(archivePath: string): Promise<string> {
    const ext = path.extname(archivePath).toLowerCase();
    switch (true) {
        case ext === '.tgz' || ext === '.tar.gz':
            return await tc.extractTar(archivePath);
        case ext === '.zip':
            return await tc.extractZip(archivePath);
        default:
            throw new Error(`Unsupported archive format: ${ext}`);
    }
}

export function setEnvironment(toolDir: string): void {
    const subDir = fs.readdirSync(toolDir)[0] || '';
    const javaHome = path.join(toolDir, subDir);

    core.exportVariable('JAVA_HOME', javaHome);
    core.addPath(path.join(javaHome, 'bin'));
    core.info(`JAVA_HOME set to: ${javaHome}`);
}
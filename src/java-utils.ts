import path from "node:path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import fs from "node:fs";
import { promises as fsPromises } from 'fs';
import { getDownloadUrl, downloadJava, extractArchive } from './helpers';

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

export function setEnvironment(dir: string) {
    // Point JAVA_HOME to the extracted folder (assumes single folder inside)
    const javaHome = fs.readdirSync(dir).length === 1
        ? path.join(dir, fs.readdirSync(dir)[0])
        : dir;

    core.exportVariable('JAVA_HOME', javaHome);
    core.addPath(path.join(javaHome, 'bin'));

    return javaHome;
}

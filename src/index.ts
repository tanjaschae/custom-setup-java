import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { isAllowed } from "./allowedInput";

async function run(): Promise<void> {

    try {
        const version = core.getInput('java-version')
        const distribution = core.getInput('distribution', {required: true})
        const pkg = core.getInput('java-package')

        if (isAllowed(version, "version") && isAllowed(distribution, "distribution") && isAllowed(pkg, "package")) {
            core.info(`${version.toUpperCase()} ${distribution.toUpperCase()} ${pkg.toUpperCase()} is a valid input`);

            const os = process.env.RUNNER_OS;
            // use arch in path
            core.info(`Directory where tools are cached: ${process.env.RUNNER_TOOL_CACHE}`);
            core.info(`Path to the checked-out repo: ${process.env.GITHUB_WORKSPACE}`);

            const downloadUrl = getDownloadUrl(distribution, version, pkg)
            core.info(`Download URL: ${downloadUrl}`);
            const archivePath =  await tc.downloadTool(downloadUrl)
            core.info(`archivePath: ${archivePath}`);
            const extractPath = await tc.extractTar(archivePath);
            core.info(`extractPath: ${extractPath}`);


        } else {
            core.info(`${version.toUpperCase()} ${distribution.toUpperCase()} ${pkg.toUpperCase()} is not a valid input`);
        }





        // OpenJDK21U-jdk_x64_linux_hotspot_21.0.7_6.tar.gz temurin
        // OpenJDK11U-jdk_x64_linux_hotspot_11.0.27_6.tar.gz
        // zulu21.42.19-ca-jdk21.0.7-linux_x64.tar.gz zulu
        // jdk-24_linux-x64_bin.tar.gz oracle


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




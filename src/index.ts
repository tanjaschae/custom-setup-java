import * as core from '@actions/core';
import { isAllowed } from "./allowedInput";

async function run(): Promise<void> {

    try {
        const javaVersion = core.getInput('java-version')
        const distribution = core.getInput('distribution', {required: true})
        const javaPackage = core.getInput('java-package')

        if (isAllowed(javaVersion, "version") && isAllowed(distribution, "distribution") && isAllowed(javaPackage, "package")) {
            core.info(`${javaVersion.toUpperCase()} ${distribution.toUpperCase()} ${javaPackage.toUpperCase()} is a valid input`);

            core.info(`Running on OS: ${process.env.RUNNER_OS}`);
            core.info(`Directory where tools are cached: ${process.env.RUNNER_TOOL_CACHE}`);
            core.info(`Path to the checked-out repo: ${process.env.GITHUB_WORKSPACE}`);

        } else {
            core.info(`${javaVersion.toUpperCase()} ${distribution.toUpperCase()} ${javaPackage.toUpperCase()} is not a valid input`);
        }





        // OpenJDK21U-jdk_x64_linux_hotspot_21.0.7_6.tar.gz temurin
        // OpenJDK11U-jdk_x64_linux_hotspot_11.0.27_6.tar.gz
        // zulu21.42.19-ca-jdk21.0.7-linux_x64.tar.gz zulu
        // jdk-24_linux-x64_bin.tar.gz oracle


        core.notice(`First try with ${javaVersion} ${distribution} ${javaPackage}`);

        core.setOutput('distribution', distribution)
        core.setOutput('version', javaVersion)
        core.setOutput('path', "java/home/path")
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}



run();




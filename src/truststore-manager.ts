import * as exec from "@actions/exec";
import * as path from 'path';
import * as core from '@actions/core';
import * as fs from 'fs';

const CERT_DIR = '/tmp/ca';
const KEY_PATH = path.join(CERT_DIR, 'rootCA.key');
const CERT_PATH = path.join(CERT_DIR, 'rootCA.pem');

export async function generateRootCA() {
    // 1. Create output directory
    await exec.exec('mkdir', ['-p', CERT_DIR]);

    // 2. Generate private key
    await exec.exec('openssl', [
        'genrsa', '-out', KEY_PATH, '2048'
    ]);

    // 3. Generate self-signed root certificate
    await exec.exec('openssl', [
        'req',
        '-x509',
        '-new',
        '-nodes',
        '-key', KEY_PATH,
        '-sha256',
        '-days', '365',
        '-out', CERT_PATH,
        '-subj', '/C=DE/ST=Berlin/L=Berlin/O=MyOrg/CN=MyRootCA'
    ]);

    console.log(`✅ Root CA created: ${CERT_PATH}`);
    return { key: KEY_PATH, cert: CERT_PATH };
}

export async function importRootCA(certPath: string, alias = 'custom-root-ca') {
    const javaHome = process.env['JAVA_HOME'];
    if (!javaHome) {
        throw new Error('JAVA_HOME is not set');
    }

    const truststorePath = path.join(javaHome, 'lib', 'security', 'cacerts');

    if (!fs.existsSync(certPath)) {
        throw new Error(`Certificate file not found at path: ${certPath}`);
    }

    core.info(`Importing ${certPath} to Java truststore at ${truststorePath}`);

    await exec.exec('keytool', [
        '-importcert',
        '-noprompt',
        '-trustcacerts',
        '-alias', alias,
        '-file', certPath,
        '-keystore', truststorePath,
        '-storepass', 'changeit' // default password for cacerts
    ]);

    return truststorePath;
}

export async function listJavaTruststore(jksPath: string, password: string) {
    await exec.exec('bash', ['-c', `keytool -list -keystore "${jksPath}" -storepass "${password}" | grep 'custom-root-ca'`]);
}

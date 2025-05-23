// truststore-manager.test.ts
import {checkRootCaInTruststore} from '../src/truststore-manager';
import * as exec from '@actions/exec';
import * as path from 'path';

jest.mock('@actions/core', () => ({
    info: jest.fn(),
}));

jest.mock('@actions/exec', () => ({
    exec: jest.fn(),
}));

jest.mock('path', () => ({
    join: jest.fn(),
}));

describe('Function: checkRootCaInTruststore', () => {
    const originalEnv = process.env;
    // Prepare the environment for each test
    beforeEach(() => {
        jest.resetModules();
        process.env = {...originalEnv};
    });

    // Restore the original environment after all tests have completed
    afterAll(() => {
        process.env = originalEnv;
    });

    it('should throw an error when JAVA_HOME is not set', async () => {
        await expect(checkRootCaInTruststore('alias')).rejects.toThrow('JAVA_HOME is not set');
    });

    it('should run keytool command to check root CA in truststore if JAVA_HOME is set', async () => {
        process.env.JAVA_HOME = 'java_home_dummy_path';
        await checkRootCaInTruststore('alias');

        expect(path.join).toHaveBeenCalledWith(process.env.JAVA_HOME, 'lib', 'security', 'cacerts');
        expect(exec.exec).toHaveBeenCalledWith('keytool', [
            '-list',
            '-keystore', path.join(process.env.JAVA_HOME, 'lib', 'security', 'cacerts'),
            '-alias', 'alias',
            '-storepass', 'changeit'
        ]);
    });
});
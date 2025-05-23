// truststore-manager.test.ts
import {checkRootCaInTruststore} from '../src/truststore-manager';
import * as exec from '@actions/exec';
import * as path from 'path';

jest.mock('path');
jest.mock('@actions/exec');

describe('Function: checkRootCaInTruststore', () => {
    const originalEnv = process.env;
    // Prepare the environment for each test
    beforeEach(() => {
        jest.resetModules();
    });

    it('should throw an error when JAVA_HOME is not set', async () => {
        await expect(checkRootCaInTruststore('alias')).rejects.toThrow('JAVA_HOME is not set');
    });

    it('should run keytool command to check root CA in truststore if JAVA_HOME is set', async () => {
        process.env.JAVA_HOME = 'java_home_dummy_path';

        const expectedPath = 'java_home_dummy_path/lib/security/cacerts';
        (path.join as jest.Mock).mockReturnValue(expectedPath);

        await checkRootCaInTruststore('alias');

        expect(path.join).toHaveBeenCalledWith(process.env.JAVA_HOME, 'lib', 'security', 'cacerts');
        expect(path.join(process.env.JAVA_HOME, 'lib', 'security', 'cacerts')).toBe(expectedPath);

        expect(exec.exec).toHaveBeenCalledWith('keytool', [
            '-list',
            '-keystore', path.join(process.env.JAVA_HOME, 'lib', 'security', 'cacerts'),
            '-alias', 'alias',
            '-storepass', 'changeit'
        ]);
    });
});
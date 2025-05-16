import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { promises as fsPromises } from 'fs';

// --- MOCK DEPENDENCIES ---
jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('fs/promises');

jest.mock('../src/helpers', () => ({
    getDownloadUrl: jest.fn(() => 'https://example.com/java.tar.gz'),
    downloadJava: jest.fn(() => '/tmp/java.tar.gz'),
    extractArchive: jest.fn(() => '/tmp/java-home'),
}));

describe('downloadAndExtractJava', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Reset between tests
    });

    test('downloads, extracts, logs, removes archive, and returns path', async () => {
        const mockInfo = core.info as jest.Mock;
        const mockExec = exec.exec as jest.Mock;
        const mockUnlink = jest.spyOn(fsPromises, 'unlink').mockResolvedValue();


        // Re-import after mock setup to ensure downloadAndExtractJava uses mocked helpers
        const { downloadAndExtractJava } = require('../src/java-utils');

        const result = await downloadAndExtractJava('temurin', '17', 'jdk', '/tmp/tool');

        expect(result).toBe('/tmp/java-home');

        // Verifies logs
        expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Download URL'));
        expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Java extracted to'));

        // Verifies exec and file delete
        expect(mockExec).toHaveBeenCalledWith('ls', ['-la', '/tmp/java-home']);
        expect(mockUnlink).toHaveBeenCalledWith('/tmp/java.tar.gz');
    });
});

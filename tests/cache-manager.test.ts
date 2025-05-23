import * as core from '@actions/core';
import * as path from 'path';
import * as cache from '@actions/cache';
import {restoreFromCache} from '../src/cache-manager';

jest.mock('@actions/core');
jest.mock('@actions/cache');
jest.mock('path');

describe('restoreFromCache', () => {
    const cacheKey = 'myKey';
    const toolDir = '/tmp/myKey';

    const mockInfo = core.info as jest.Mock;
    const mockCache = cache.restoreCache as jest.Mock;
    const mockPathJoin = path.join as jest.Mock;

    beforeEach(() => {
        jest.resetAllMocks();

        process.env.RUNNER_TOOL_CACHE = '/tmp';
        mockInfo.mockImplementation(() => undefined);
        mockPathJoin.mockReturnValue(toolDir);
    });

    it('should restore from cache correctly and return cacheHit as true', async () => {
        mockCache.mockResolvedValue('1');
        const result = await restoreFromCache(cacheKey);

        expect(result.cacheHit).toBeTruthy();
        expect(result.toolDir).toBe(toolDir);
        expect(mockCache).toHaveBeenCalledWith([toolDir], cacheKey);
        expect(mockInfo).toHaveBeenCalledWith(`Directory where tools are cached: ${process.env.RUNNER_TOOL_CACHE}`);
        expect(mockInfo).toHaveBeenCalledWith(`Restored cache for key: ${toolDir}`);
    });

    it('should not restore from cache and return cacheHit as false', async () => {
        mockCache.mockResolvedValue(null);
        const result = await restoreFromCache(cacheKey);

        expect(result.cacheHit).toBeFalsy();
        expect(result.toolDir).toBe(toolDir);
        expect(mockCache).toHaveBeenCalledWith([toolDir], cacheKey);
        expect(mockInfo).toHaveBeenCalledWith(`Directory where tools are cached: ${process.env.RUNNER_TOOL_CACHE}`);
    });
});
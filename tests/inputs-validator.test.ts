// inputs-validator.test.ts

import * as core from '@actions/core';
import {validateInputs} from '../src/inputs-validator';

jest.mock('@actions/core');

describe("validateInputs", () => {
    it("should pass valid inputs", () => {
        (core.getInput as jest.MockedFunction<typeof core.getInput>)
            .mockImplementationOnce(() => '11')
            .mockImplementationOnce(() => 'temurin')
            .mockImplementationOnce(() => 'jdk');

        expect(() => validateInputs()).not.toThrow();
    });

    it("should throw error invalid inputs", () => {
        (core.getInput as jest.MockedFunction<typeof core.getInput>)
            .mockImplementationOnce(() => '2.0')
            .mockImplementationOnce(() => 'Oracle')
            .mockImplementationOnce(() => 'jdk');

        expect(() => validateInputs()).toThrowError(/2.0, Oracle, jdk is not a valid input/);
    });
});
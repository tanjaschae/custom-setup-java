"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedDistributions = void 0;
exports.isAllowed = isAllowed;
exports.allowedDistributions = {
    version: ['11', '17', '21'],
    distribution: ['temurin', 'oracle', 'zulu'],
    package: ['jre', 'jdk']
};
function isAllowed(value, group) {
    const allowedList = exports.allowedDistributions[group];
    return allowedList.includes(value);
}

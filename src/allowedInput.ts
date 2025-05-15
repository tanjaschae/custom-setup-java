export const allowedDistributions = {
    version: ['11', '17', '21'] as const,
    distribution: ['temurin', 'oracle', 'zulu'] as const,
    package: ['jre', 'jdk'] as const,
};

type AllowedDistributionsMap = typeof allowedDistributions;
type AllowedDistributionKeys = keyof AllowedDistributionsMap;
type AllowedDistributionValue<K extends AllowedDistributionKeys> = AllowedDistributionsMap[K][number];

/**
 * Helper function to retrieve the list of allowed values for a given group.
 * @param group The group key from allowedDistributions.
 * @returns The readonly array of allowed values for the given group.
 */
function getAllowedValues<K extends AllowedDistributionKeys>(
    group: K
): readonly string[] {
    if (!(group in allowedDistributions)) {
        throw new Error(`Invalid group: "${group}". Valid groups are ${Object.keys(allowedDistributions).join(', ')}.`);
    }
    return allowedDistributions[group];
}

/**
 * Validates if a given value belongs to the allowed list for a specified group.
 * @param value The value to validate.
 * @param group The group to validate the value against.
 * @returns `true` if the value is allowed, otherwise `false`.
 */
export function isAllowed<K extends AllowedDistributionKeys>(
    value: string,
    group: K
): value is AllowedDistributionValue<K> {
    const allowedList = getAllowedValues(group);
    return allowedList.includes(value);
}

export const allowedDistributions = {
    version: ['11', '17', '21'] as const,
    distribution: ['temurin', 'oracle', 'zulu'] as const,
    package: ['jre', 'jdk'] as const
};

type AllowedGroups = typeof allowedDistributions;
type AllowedKeys = keyof AllowedGroups;
type AllowedValue<K extends AllowedKeys> = AllowedGroups[K][number];

export function isAllowed<K extends AllowedKeys>(
    value: string,
    group: K
): value is AllowedValue<K> {
    const allowedList = allowedDistributions[group] as readonly string[];
    return allowedList.includes(value);
}

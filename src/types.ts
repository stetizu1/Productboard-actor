export type SubfeatureData = {
    title: string,
    description: string | null,
    timeline: string | null
}

export type FeatureData = {
    title: string,
    description: string | null,
    timeline: string[],
    team: string | null,
    features: Record<string, SubfeatureData> | null
}

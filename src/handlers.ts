import { Page, Response } from 'playwright';
import axios from 'axios';
import log from '@apify/log';
import { isArrayOfObjects, isObject } from './utils.js';
import { FeatureData } from './types.js';
import { loginSelectors } from './constants.js';

export const handleLogin = async (page: Page, { userEmail, userPassword }: {
    userEmail: string;
    userPassword: string
}) => {
    await page.click(loginSelectors.emailInput);
    await page.keyboard.type(userEmail);
    await page.click(loginSelectors.passwordInput);
    await page.keyboard.type(userPassword);
    await page.click(loginSelectors.submitButton);
};

const isFeature = (test: Record<string, unknown>) => test.featureType === 'feature';
const isSubfeature = (test: Record<string, unknown>) => test.featureType === 'subfeature';

type RequiredResponse = {
    releases: Array<Record<string, unknown>>
    features: Array<Record<string, unknown>>
    listColumnItems: Array<Record<string, unknown>>
    releaseAssignments: Array<Record<string, unknown>>
    columnValues: Array<Record<string, unknown>>
}

export const parseRequiredResponse = async ({ response } : { response: Response }): Promise<RequiredResponse | null> => {
    try {
        const jsonResponse = await response.json();
        if (!isObject(jsonResponse)) {
            throw new Error('Invalid response format');
        }
        const { releases, features, listColumnItems, releaseAssignments, columnValues } = jsonResponse;
        if (!isArrayOfObjects(releases)) throw new Error('Invalid data format of releases');
        if (!isArrayOfObjects(features)) throw new Error('Invalid data format of features');
        if (!isArrayOfObjects(listColumnItems)) throw new Error('Invalid data format of listColumnItems');
        if (!isArrayOfObjects(releaseAssignments)) throw new Error('Invalid data format of releaseAssignments');
        if (!isArrayOfObjects(columnValues)) throw new Error('Invalid data format of columnValues');

        return { releases, features, listColumnItems, releaseAssignments, columnValues };
    } catch (err) {
        log.error('Failed to parse response as JSON.', { err });
        return null;
    }
};

const getReleasesMap = (releases: Array<Record<string, unknown>>): Record<string, string> => (
    Object.fromEntries(releases.map((release) => ([release.id, release.name])))
);

const getTeamsMap = (listColumnItems: Array<Record<string, unknown>>): Record<string, string> => (
    Object.fromEntries(listColumnItems.map((columnItem) => ([columnItem.id, columnItem.label])))
);

type FeatureItemsMap = {[p: string]: FeatureData};
type SubfeatureItemsMap = {[p: string]: { id: string; parentId: string; title: string; timeline: string | null }};
const getFeatureItemMaps = (features: Array<Record<string, unknown>>): {
    featureItemsMap: FeatureItemsMap;
    subfeatureItemsMap: SubfeatureItemsMap
} => {
    const allItems = Object.values(features);
    const featureItemsMap = Object.fromEntries(allItems
        .filter(isFeature)
        .map((item) => (
            [String(item.id),
                { title: String(item.name), description: null, timeline: [] as string[], team: null, features: null }])),
    );

    const subfeatureItemsMap = Object.fromEntries(allItems
        .filter(isSubfeature)
        .map((item) => (
            [String(item.id),
                { id: String(item.id), title: String(item.name), parentId: String(item.parentId), timeline: null }])));
    return {
        featureItemsMap,
        subfeatureItemsMap,
    };
};

const addTeamsToFeatureMaps = (
    { columnValues, teamsMap, featureItemsMap }:{
        columnValues: Array<Record<string, unknown>>,
        teamsMap: Record<string, string>,
        featureItemsMap: FeatureItemsMap
    },
) => {
    columnValues.forEach(({ value, featureId }) => {
        if ((typeof featureId !== 'number' && typeof featureId !== 'string') || (typeof value !== 'number' && typeof value !== 'string')) {
            log.warning('Invalid feature id or value in columnValues // skipped', { featureId, value });
            return;
        }
        if (featureId in featureItemsMap) {
            featureItemsMap[featureId].team = teamsMap[value];
        }
    });
};

const addReleasesToFeatureMaps = (
    { releaseAssignments, releasesMap, featureItemsMap, subfeatureItemsMap }:{
        releaseAssignments: Array<Record<string, unknown>>,
        releasesMap: Record<string, string>,
        featureItemsMap: FeatureItemsMap,
        subfeatureItemsMap: SubfeatureItemsMap
    },
) => {
    releaseAssignments.forEach(({ releaseId, featureId }) => {
        if ((typeof featureId !== 'number' && typeof featureId !== 'string') || (typeof releaseId !== 'number' && typeof releaseId !== 'string')) {
            log.warning('Invalid release or feature id in releaseAssignments // skipped', { releaseId, featureId });
            return;
        }
        if (featureId in featureItemsMap) {
            featureItemsMap[featureId].timeline = [...featureItemsMap[featureId].timeline, releasesMap[releaseId]];
        }
        if (featureId in subfeatureItemsMap) {
            subfeatureItemsMap[featureId].timeline = releasesMap[releaseId];
        }
    });
};

const addSubfeaturesToFeatureMaps = (
    { featureItemsMap, subfeatureItemsMap }:{
        featureItemsMap: FeatureItemsMap,
        subfeatureItemsMap: SubfeatureItemsMap
    },
) => {
    Object.values(subfeatureItemsMap)
        .forEach((item) => {
            const { id, title, timeline, parentId } = item;

            featureItemsMap[parentId].features = { ...featureItemsMap[parentId].features, [id]: { title, description: null, timeline } };
        });
};

export const handleInitialRequest = async (response: RequiredResponse): Promise<Record<string, FeatureData> | null> => {
    const { releases, features, listColumnItems, releaseAssignments, columnValues } = response;

    const releasesMap = getReleasesMap(releases);
    const teamsMap = getTeamsMap(listColumnItems);
    const { featureItemsMap, subfeatureItemsMap } = getFeatureItemMaps(features);

    addTeamsToFeatureMaps({ columnValues, teamsMap, featureItemsMap });
    addReleasesToFeatureMaps({ releaseAssignments, releasesMap, featureItemsMap, subfeatureItemsMap });

    addSubfeaturesToFeatureMaps({ featureItemsMap, subfeatureItemsMap });

    return featureItemsMap;
};

const getFeatureDetail = async ({ featureId, cookieHeader }:{featureId: string, cookieHeader: string}) => (await axios.get(`https://apify.productboard.com/api/features/${featureId}`, { headers: { Cookie: cookieHeader } })).data.feature;

export const getHandleDetailRequest = ({ cookieHeader, featureItemsMap }: { cookieHeader: string, featureItemsMap: Record<string, FeatureData>}) => (
    async ({ featureId }: { featureId: string }) => {
        const featureDetail = await getFeatureDetail({ featureId, cookieHeader });

        const subfeatures = featureItemsMap[featureId].features;
        if (subfeatures === null) {
            return {
                ...featureItemsMap[featureId],
                description: featureDetail.description,
            };
        }
        const subfeaturesWithDescription = Object.fromEntries(
            await Promise.all(
                Object.entries(subfeatures).map(async ([subfeatureId, subfeature]) => {
                    const subfeatureDetail = await getFeatureDetail({ featureId: subfeatureId, cookieHeader });
                    return [subfeatureId, { ...subfeature, description: subfeatureDetail.description }];
                })));

        return {
            ...featureItemsMap[featureId],
            description: featureDetail.description,
            features: subfeaturesWithDescription,
        };
    });

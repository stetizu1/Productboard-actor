import { Actor } from 'apify';
import { chromium } from 'playwright';
import { getHandleDetailRequest, parseRequiredResponse, handleInitialRequest, handleLogin } from './handlers.js';
import { isRoadmapInitialRequest, STORE_ID } from './constants.js';
import {FeatureData} from "./types.js";

await Actor.init();

// actor input
interface Input {
    productboardRoadmapUrl: string;
    userEmail: string;
    userPassword: string
}
const { productboardRoadmapUrl, userEmail, userPassword } = await Actor.getInput<Input>() ?? {};
if (!productboardRoadmapUrl || !userEmail || !userPassword) {
    throw new Error('At least one of the required actor inputs is missing.');
}

// actor store
const keyValueStore = await Actor.openKeyValueStore(STORE_ID);

// launch and login
const browser = await chromium.launch({ headless: true });

const page = await browser.newPage();
await page.goto(productboardRoadmapUrl);
await page.waitForLoadState('load');

await handleLogin(page, { userEmail, userPassword });

// catch initial request and get and store data
await page.waitForResponse(async (response) => {
    const isInitialRequest = isRoadmapInitialRequest({ requestUrl: response.request().url(), productboardRoadmapUrl });
    if (!isInitialRequest) return false;

    const requiredResponse = await parseRequiredResponse({ response });
    if (!requiredResponse) return false;

    const featureItemsMap = await handleInitialRequest(requiredResponse);
    if (!featureItemsMap) return false;

    const cookieHeader = (await response.request().allHeaders()).cookie;
    const handleDetailRequest = getHandleDetailRequest({ cookieHeader, featureItemsMap });

    await Promise.all(Object.keys(featureItemsMap).map(async (featureId) => {
        const valueToStore = await handleDetailRequest({ featureId });
        await keyValueStore.setValue(featureId, valueToStore);
    }));
    return true;
});

const output: Record<string, FeatureData | null> = {};
await keyValueStore.forEachKey(async (key) => {
    output[key] = await keyValueStore.getValue(key);
});

await Actor.setValue('OUTPUT', output);

await browser.close();
await Actor.exit();

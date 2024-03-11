export const loginSelectors = {
    emailInput: 'input#email',
    passwordInput: 'input#password',
    submitButton: 'button[type="submit"]',
} as const;

export const STORE_ID = 'result';
export const STORE_RESULT_KEY = 'OUTPUT';

const getRoadmapId = (url: string) => url.split('/roadmap/')[1].split('-')[0];
export const isRoadmapInitialRequest = ({ requestUrl, productboardRoadmapUrl }:{requestUrl: string, productboardRoadmapUrl: string}) => (
    requestUrl.includes(`/${getRoadmapId(productboardRoadmapUrl)}/initial`)
);

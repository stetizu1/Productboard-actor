export const STORE_ID = 'result';

const getRoadmapId = (url: string) => url.split('/roadmap/')[1].split('-')[0];
export const isRoadmapInitialRequest = ({ requestUrl, productboardRoadmapUrl }:{requestUrl: string, productboardRoadmapUrl: string}) => (
    requestUrl.includes(`/${getRoadmapId(productboardRoadmapUrl)}/initial`)
);

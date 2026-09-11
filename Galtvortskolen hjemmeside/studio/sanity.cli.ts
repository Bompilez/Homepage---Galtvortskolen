import { defineCliConfig } from 'sanity/cli';
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  deployment: {
    appId: 'vxerdm1xocdeyyck6ffkg64m',
  },
  studioHost: 'galtvortskolen',
});

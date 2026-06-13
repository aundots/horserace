/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEV_LOGIN?: string;
  readonly VITE_DEV_USER_KEY?: string;
  readonly VITE_AD_GROUP_ID?: string;
  readonly VITE_AD_DEV_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

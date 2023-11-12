/// <reference types="vite/client" />

declare const __IS_PROD__: string;
declare const __API_URL__: string;
declare const __VERSION__: string;
declare const AwesomeComment: {
  init(dom: string | HTMLElement, apiUrl: string, domain: string, clientId: string): void;
};
declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}

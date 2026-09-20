/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Extension id from extensionpay.com. Unset = simulated billing. */
  readonly VITE_EXTPAY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

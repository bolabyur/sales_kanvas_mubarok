export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Sales Kanvas";

/** Title web */
export const pageTitle = (page?: string) =>
  page ? `${page} | ${APP_NAME}` : APP_NAME;

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? "Sales Kanvas";

export const pageTitle = (page?: string) =>
  page ? `${page} | ${APP_NAME}` : APP_NAME;

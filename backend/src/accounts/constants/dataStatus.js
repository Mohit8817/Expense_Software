/** 1 = created in KLK app, 2 = created/synced via Tally API */
export const DATA_STATUS_APP = 1;
export const DATA_STATUS_TALLY = 2;

export function resolveDataStatus(req) {
  return req?.data_status === DATA_STATUS_TALLY ? DATA_STATUS_TALLY : DATA_STATUS_APP;
}

/** 1 = created in KLK software, 2 = imported via Tally API */
export const DATA_STATUS_APP = 1;
export const DATA_STATUS_TALLY = 2;

export const dataSourceLabel = (dataStatus) =>
  Number(dataStatus) === DATA_STATUS_TALLY ? "Tally" : "Software";

export const dataSourceVariant = (dataStatus) =>
  Number(dataStatus) === DATA_STATUS_TALLY ? "info" : "primary";

export const mapDataSourceFields = (record) => {
  const data_status = Number(record?.data_status) || DATA_STATUS_APP;
  return {
    data_status,
    sourceLabel: dataSourceLabel(data_status),
    sourceVariant: dataSourceVariant(data_status),
  };
};

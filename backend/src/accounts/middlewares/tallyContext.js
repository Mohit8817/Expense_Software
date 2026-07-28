import { DATA_STATUS_TALLY } from "../constants/dataStatus.js";

/**
 * Tally write routes — set user context and data_status after company_id is validated.
 * company_id is already required globally by requireTallyCompanyId.
 */
export function tallyContext(req, res, next) {
  const user_id =
    req.query.user_id ||
    req.body?.user_id ||
    process.env.TALLY_DEFAULT_USER_ID ||
    1;

  req.user = {
    company_id: req.tally_company_id,
    id: Number(user_id),
    role_id: null,
  };

  req.data_status = DATA_STATUS_TALLY;

  next();
}

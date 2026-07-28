/**
 * Resolve company_id from query or body (never optional for Tally APIs).
 */
export function resolveTallyCompanyId(req) {
  const raw = req.query?.company_id ?? req.body?.company_id;
  if (raw === undefined || raw === null) return null;
  const company_id = String(raw).trim();
  return company_id || null;
}

/** Require company_id on every /api/tally request before any handler runs. */
export function requireTallyCompanyId(req, res, next) {
  const company_id = resolveTallyCompanyId(req);
  if (!company_id) {
    return res.status(400).json({
      message:
        "company_id is required on every Tally API request (pass as query parameter or in request body)",
    });
  }
  req.tally_company_id = company_id;
  next();
}

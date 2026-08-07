import React from "react";
import { Badge } from "react-bootstrap";
import { dataSourceLabel, dataSourceVariant } from "./dataSourceUtils";

const SourceBadge = ({ dataStatus, label, variant, className = "" }) => (
  <Badge
    bg={variant || dataSourceVariant(dataStatus)}
    className={`rounded-pill ${className}`}
  >
    {label || dataSourceLabel(dataStatus)}
  </Badge>
);

export default SourceBadge;

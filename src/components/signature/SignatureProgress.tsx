"use client";

import type { SignatureField } from "@/types/signature";
import { Box } from "@mui/material";

import { styled } from "@mui/material/styles";

const ProgressRoot = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: 48,
  zIndex: 90,
  background: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5, 0),
  [theme.breakpoints.up("sm")]: {
    top: 64,
  },
}));

const ProgressContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: theme.spacing(0.75),
  },
}));

const ProgressLabel = styled(Box)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const ProgressTrack = styled(Box)(({ theme }) => ({
  width: "100%",
  height: 6,
  marginTop: theme.spacing(0.75),
  background: theme.palette.action.hover,
  borderRadius: 999,
  overflow: "hidden",
}));

const ProgressFill = styled(Box)(({ theme }) => ({
  height: "100%",
  background: theme.palette.primary.main,
  borderRadius: 999,
  transition: "width 200ms ease",
}));

const Percentage = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  fontSize: 13,
  color: theme.palette.text.secondary,
}));

interface SignatureProgressProps {
  fields: SignatureField[];
}

export default function SignatureProgress({ fields }: SignatureProgressProps) {
  const total = fields.length;

  const completed = fields.filter(
    (field) => field.status === "signed" && !!field.signatureDataUrl,
  ).length;

  if (total === 0) {
    return null;
  }

  const percentage = Math.round((completed / total) * 100);

  const allSigned = completed === total;

  return (
    <ProgressRoot>
      <ProgressContent>
        <div>
          <ProgressLabel>
            {allSigned
              ? "All signatures completed"
              : `${completed} of ${total} signatures completed`}
          </ProgressLabel>
          <ProgressTrack>
            <ProgressFill sx={{ width: `${percentage}%` }} />
          </ProgressTrack>
        </div>
        <Percentage>
          {percentage}%
        </Percentage>
      </ProgressContent>
    </ProgressRoot>
  );
}

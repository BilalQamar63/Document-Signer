"use client";

import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import HeightIcon from "@mui/icons-material/Height";
import { Divider, IconButton, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

/**
 * Preset zoom levels, expressed as a percentage
 * relative to the "fit width" baseline (100%).
 */
export const ZOOM_LEVELS = [75, 90, 100, 125, 150, 175, 200] as const;

export const MIN_ZOOM = ZOOM_LEVELS[0];
export const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];

const Root = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const PercentageLabel = styled(Typography)(({ theme }) => ({
  minWidth: 48,
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 600,
  color: theme.palette.text.primary,
  userSelect: "none",
}));

interface PdfZoomControlsProps {
  /**
   * Current zoom, as a percentage relative to
   * the "fit width" baseline (100%).
   */
  zoomPercentage: number;

  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
}

export default function PdfZoomControls({
  zoomPercentage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
}: PdfZoomControlsProps) {
  const roundedPercentage = Math.round(zoomPercentage);

  return (
    <Root role="group" aria-label="Zoom controls">
      <Tooltip title="Zoom out">
        <span>
          <IconButton
            size="small"
            onClick={onZoomOut}
            disabled={roundedPercentage <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <PercentageLabel variant="body2" aria-live="polite">
        {roundedPercentage}%
      </PercentageLabel>

      <Tooltip title="Zoom in">
        <span>
          <IconButton
            size="small"
            onClick={onZoomIn}
            disabled={roundedPercentage >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      <Tooltip title="Fit width">
        <span>
          <IconButton size="small" onClick={onFitWidth} aria-label="Fit width">
            <FitScreenIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Fit page">
        <span>
          <IconButton size="small" onClick={onFitPage} aria-label="Fit page">
            <HeightIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Root>
  );
}

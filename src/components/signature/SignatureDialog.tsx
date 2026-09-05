"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import SignatureCanvas from "./SignatureCanvas";

const CurrentSignature = styled("div")(({ theme }) => ({
  width: "100%",
  height: 96,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.grey[50],
  marginBottom: theme.spacing(2),
  overflow: "hidden",
  [theme.breakpoints.up("sm")]: {
    height: 120,
    marginBottom: theme.spacing(3),
  },
}));

const CurrentSignatureImage = styled("img")({
  maxWidth: "90%",
  maxHeight: "90%",
  objectFit: "contain",
  display: "block",
});

const Actions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  gap: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column-reverse",
    alignItems: "stretch",
    padding: theme.spacing(1.5),
    "& > button": {
      width: "100%",
    },
  },
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(1.5, 3, 2.5),
  },
}));

interface SignatureDialogProps {
  open: boolean;

  onClose: () => void;

  onComplete: (signatureDataUrl: string) => void;

  /**
   * True when the user is replacing
   * an existing signature.
   */
  isResigning?: boolean;

  /**
   * Existing signature image.
   *
   * Used only for displaying the current
   * signature while re-signing.
   */
  existingSignature?: string;
}

export default function SignatureDialog({
  open,
  onClose,
  onComplete,
  isResigning = false,
  existingSignature,
}: SignatureDialogProps) {
  const theme = useTheme();
  const isExtraSmall = useMediaQuery(theme.breakpoints.down("sm"));
  /*
   * Temporary signature being drawn
   * inside the canvas.
   *
   * IMPORTANT:
   *
   * This is NOT written to the PDF until
   * the user presses "Use Signature".
   */
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  /*
   * Reset the temporary canvas state
   * whenever the dialog opens.
   *
   * This is especially important for
   * re-signing.
   */
  useEffect(() => {
    if (open) {
      setSignatureDataUrl(null);
    }
  }, [open]);

  /*
   * Close dialog.
   *
   * We intentionally do NOT modify the
   * existing SignatureField here.
   *
   * Therefore:
   *
   * Re-sign → Cancel
   *
   * keeps the old signature.
   */
  function handleClose() {
    setSignatureDataUrl(null);

    onClose();
  }

  /*
   * Save the new signature.
   */
  function handleComplete() {
    if (!signatureDataUrl) {
      return;
    }

    /*
     * Parent updates the exact SignatureField.
     *
     * For normal signing:
     * pending → signed
     *
     * For re-signing:
     * old signature → new signature
     */
    onComplete(signatureDataUrl);

    /*
     * Clear temporary dialog state.
     */
    setSignatureDataUrl(null);
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isExtraSmall}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {isResigning ? "Change Signature" : "Create Signature"}
      </DialogTitle>

      <DialogContent>
        {isResigning && existingSignature && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Current signature
            </Typography>

            <CurrentSignature>
              <CurrentSignatureImage
                src={existingSignature}
                alt="Current signature"
                draggable={false}
              />
            </CurrentSignature>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Draw your new signature
            </Typography>
          </>
        )}

        {!isResigning && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Draw your signature below.
          </Typography>
        )}

        <SignatureCanvas onChange={setSignatureDataUrl} />
      </DialogContent>

      <Actions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>

        <Button
          onClick={handleComplete}
          variant="contained"
          disabled={!signatureDataUrl}
        >
          {isResigning ? "Replace Signature" : "Use Signature"}
        </Button>
      </Actions>
    </Dialog>
  );
}

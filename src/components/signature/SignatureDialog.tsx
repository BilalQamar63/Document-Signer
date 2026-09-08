"use client";

import { useEffect, useState } from "react";

import {
  Box,
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
import Image from "next/image";

const CurrentSignature = styled(Box)(({ theme }) => ({
  position: "relative",
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

const CurrentSignatureImage = styled(Image)({
  position: "absolute",
  inset: "5%",
  width: "90%",
  height: "90%",
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
  isResigning?: boolean;
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
  
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  
  useEffect(() => {
    if (open) {
      setSignatureDataUrl(null);
    }
  }, [open]);

  
  function handleClose() {
    setSignatureDataUrl(null);

    onClose();
  }

  
  function handleComplete() {
    if (!signatureDataUrl) {
      return;
    }
    onComplete(signatureDataUrl);

  
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
                fill
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

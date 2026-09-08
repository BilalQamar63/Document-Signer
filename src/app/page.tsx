"use client";

import { useState } from "react";

import { Box, Button, CircularProgress, Input, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import PdfViewer from "@/components/pdf/PdfViewer";
import SignatureDialog from "@/components/signature/SignatureDialog";
import SignatureProgress from "@/components/signature/SignatureProgress";

import { usePdf } from "@/hooks/usePdf";

import { downloadPdf } from "@/lib/pdf/downloadPdf";
import { signPdf } from "@/lib/pdf/signPdf";

import type { SignatureField } from "@/types/signature";

const PageRoot = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  color: theme.palette.text.primary,
}));

const StateRoot = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: theme.spacing(2),
}));

const StatePaper = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 520,
  padding: theme.spacing(3),
  textAlign: "center",
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(5),
  },
}));

const FileInput = styled(Input)({
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
});

const Header = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 100,
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(2),
  },
}));

const HeaderContent = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  display: "flex",
  alignItems: "stretch",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    alignItems: "center",
    flexDirection: "row",
  },
}));

const HeaderActions = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

const Content = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  padding: theme.spacing(0, 1.5, 3),
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(0, 2, 4),
  },
}));

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);

  const [activeSignatureField, setActiveSignatureField] =
    useState<SignatureField | null>(null);



  const [isResigning, setIsResigning] = useState(false);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const {
    signatureFields: detectedSignatureFields,
    loading,
    error,
  } = usePdf(file);



  const displayedFields =
    signatureFields.length > 0 ? signatureFields : detectedSignatureFields;

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      alert("Please select a PDF file.");

      return;
    }
    setSignatureFields([]);

    setActiveSignatureField(null);

    setIsResigning(false);

    setFile(selectedFile);
  }


  function handleSignatureClick(field: SignatureField) {
    const alreadySigned = field.status === "signed" && !!field.signatureDataUrl;

    setIsResigning(alreadySigned);

    setActiveSignatureField(field);
  }

  function handleSignatureComplete(signatureDataUrl: string) {
    if (!activeSignatureField) {
      return;
    }

    setSignatureFields((currentFields) => {
      const fields =
        currentFields.length > 0 ? currentFields : detectedSignatureFields;

      return fields.map((field) => {
        if (field.id !== activeSignatureField.id) {
          return field;
        }

        return {
          ...field,
          status: "signed",
          signatureDataUrl,
        };
      });
    });

    setActiveSignatureField(null);
    setIsResigning(false);
  }


  function handleSignatureCancel() {
    setActiveSignatureField(null);
    setIsResigning(false);
  }


  function getSignedFilename(originalFilename: string) {
    const lastDot = originalFilename.lastIndexOf(".");

    if (lastDot === -1) {
      return `${originalFilename}-signed.pdf`;
    }

    return `${originalFilename.slice(0, lastDot)}-signed.pdf`;
  }

  async function handleDownload() {
    if (!file) {
      return;
    }

    if (!allSignaturesCompleted) {
      alert("Please complete all signatures first.");

      return;
    }

    try {
      const signedPdf = await signPdf(file, displayedFields);

      downloadPdf(signedPdf, getSignedFilename(file.name));
    } catch (error) {
      console.error("Failed to create signed PDF:", error);

      alert("Unable to create the signed PDF.");
    }
  }

  const allSignaturesCompleted =
    displayedFields.length > 0 &&
    displayedFields.every(
      (field) => field.status === "signed" && !!field.signatureDataUrl,
    );

  if (!file) {
    return (
      <StateRoot>
        <StatePaper elevation={2}>
          <Typography component="h1" variant="h4" gutterBottom>
            Document Signer
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Upload a PDF to review and sign it.
          </Typography>
          <Button component="label" variant="contained" fullWidth>
            Choose PDF
            <FileInput
              inputProps={{
                id: "pdf-upload",
                type: "file",
                "aria-label": "Upload a PDF document",
                accept: "application/pdf",
              }}
              onChange={handleFileChange}
            />
          </Button>
        </StatePaper>
      </StateRoot>
    );
  }

  if (loading) {
    return (
      <StateRoot>
        <StatePaper elevation={1}>
          <CircularProgress aria-label="Analyzing document" />
          <Typography component="p" sx={{ mt: 2 }}>
            Analyzing document...
          </Typography>
        </StatePaper>
      </StateRoot>
    );
  }

  if (error) {
    return (
      <StateRoot>
        <StatePaper elevation={1}>
          <Typography component="h1" variant="h6" gutterBottom>
            Unable to analyze this PDF
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
        </StatePaper>
      </StateRoot>
    );
  }

  return (
    <PageRoot>
      <Header>
        <HeaderContent>
          <Typography component="h1" variant="h6" noWrap>
            Document Signer
          </Typography>
          <HeaderActions>
            <Button component="label" variant="outlined" color="inherit">
              Choose Another PDF
              <FileInput
                inputProps={{
                  type: "file",
                  "aria-label": "Choose another PDF document",
                  accept: "application/pdf",
                  onClick: (event: React.MouseEvent<HTMLInputElement>) => {
                    event.currentTarget.value = "";
                  },
                }}
                onChange={handleFileChange}
              />
            </Button>
            <Button
              type="button"
              onClick={handleDownload}
              disabled={!allSignaturesCompleted}
              variant="contained"
            >
              Download Signed PDF
            </Button>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <Content>
        <SignatureProgress fields={displayedFields} />
        <PdfViewer
          file={file}
          signatureFields={displayedFields}
          onSignatureClick={handleSignatureClick}
        />
      </Content>

      <SignatureDialog
        open={activeSignatureField !== null}
        isResigning={isResigning}
        existingSignature={
          isResigning ? activeSignatureField?.signatureDataUrl : undefined
        }
        onClose={handleSignatureCancel}
        onComplete={handleSignatureComplete}
      />
    </PageRoot>
  );
}

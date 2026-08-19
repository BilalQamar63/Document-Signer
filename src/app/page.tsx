// "use client";

// import { useState } from "react";

// import PdfViewer from "@/components/pdf/PdfViewer";
// import SignatureDialog from "@/components/signature/SignatureDialog";
// import { usePdf } from "@/hooks/usePdf";

// import type { SignatureField } from "@/types/signature";
// import { signPdf } from "@/lib/pdf/signPdf";
// import { downloadPdf } from "@/lib/pdf/downloadPdf";
// import SignatureProgress from "@/components/signature/SignatureProgress";

// export default function HomePage() {
//   const [file, setFile] = useState<File | null>(null);

//   const [activeSignatureField, setActiveSignatureField] =
//     useState<SignatureField | null>(null);

//   /*
//    * IMPORTANT:
//    *
//    * signatureFields comes from usePdf().
//    * We create our own local state so we can update
//    * a field after the user signs.
//    */
//   const {
//     signatureFields: detectedSignatureFields,
//     loading,
//     error,
//   } = usePdf(file);

//   const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);

//   /*
//    * When detected fields change, copy them
//    * into our editable local state.
//    */
//   const displayedFields =
//     signatureFields.length > 0 ? signatureFields : detectedSignatureFields;

//   function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
//     const selectedFile = event.target.files?.[0];

//     if (!selectedFile) {
//       return;
//     }

//     if (selectedFile.type !== "application/pdf") {
//       alert("Please select a PDF file.");

//       return;
//     }

//     /*
//      * Reset previous signature state
//      * when a new PDF is selected.
//      */
//     setSignatureFields([]);

//     setActiveSignatureField(null);

//     setFile(selectedFile);
//   }

//   function handleSignatureClick(field: SignatureField) {
//     setActiveSignatureField(field);
//   }

//   function handleSignatureComplete(signatureDataUrl: string) {
//     if (!activeSignatureField) {
//       return;
//     }

//     /*
//      * Save the signature inside the
//      * corresponding SignatureField.
//      */
//     setSignatureFields((currentFields) => {
//       const fields =
//         currentFields.length > 0 ? currentFields : detectedSignatureFields;

//       return fields.map((field) =>
//         field.id === activeSignatureField.id
//           ? {
//               ...field,

//               status: "signed",

//               signatureDataUrl,
//             }
//           : field,
//       );
//     });

//     /*
//      * Close the signature dialog.
//      */
//     setActiveSignatureField(null);
//   }

//   function getSignedFilename(originalFilename: string) {
//     const lastDot = originalFilename.lastIndexOf(".");

//     if (lastDot === -1) {
//       return `${originalFilename}-signed.pdf`;
//     }

//     return `${originalFilename.slice(0, lastDot)}-signed.pdf`;
//   }

//   async function handleDownload() {
//     if (!file) {
//       return;
//     }

//     try {
//       const signedPdf = await signPdf(file, displayedFields);

//       downloadPdf(signedPdf, getSignedFilename(file.name));
//     } catch (error) {
//       console.error("Failed to create signed PDF:", error);

//       alert("Unable to create the signed PDF.");
//     }
//   }

//   const allSignaturesCompleted =
//     displayedFields.length > 0 &&
//     displayedFields.every(
//       (field) => field.status === "signed" && !!field.signatureDataUrl,
//     );

//   /*
//    * No PDF selected.
//    */
//   if (!file) {
//     return (
//       <main
//         style={{
//           minHeight: "100vh",

//           display: "grid",

//           placeItems: "center",
//         }}
//       >
//         <div>
//           <h1>Document Signer</h1>

//           <input
//             type="file"
//             accept="application/pdf"
//             onChange={handleFileChange}
//           />
//         </div>
//       </main>
//     );
//   }

//   /*
//    * PDF is being analyzed.
//    */
//   if (loading) {
//     return (
//       <main>
//         <p>Analyzing document...</p>
//       </main>
//     );
//   }

//   /*
//    * PDF analysis failed.
//    */
//   if (error) {
//     return (
//       <main>
//         <p>{error}</p>
//       </main>
//     );
//   }

//   return (
//     <main>
//       <div
//         style={{
//           position: "sticky",
//           top: 0,
//           zIndex: 100,

//           display: "flex",
//           justifyContent: "flex-end",

//           padding: 16,

//           background: "#fff",

//           borderBottom: "1px solid #e5e7eb",
//         }}
//       >
//         <button
//           type="button"
//           onClick={handleDownload}
//           disabled={!allSignaturesCompleted}
//           style={{
//             padding: "10px 18px",

//             border: "none",

//             borderRadius: 8,

//             background: "#2563eb",

//             color: "#fff",

//             fontWeight: 600,

//             cursor: "pointer",

//             opacity: displayedFields.some((field) => field.status === "signed")
//               ? 1
//               : 0.5,
//           }}
//         >
//           Download Signed PDF
//         </button>
//       </div>

//       <SignatureProgress fields={displayedFields} />
//       <PdfViewer
//         file={file}
//         signatureFields={displayedFields}
//         onSignatureClick={handleSignatureClick}
//       />

//       <SignatureDialog
//         open={activeSignatureField !== null}
//         onClose={() => setActiveSignatureField(null)}
//         onComplete={handleSignatureComplete}
//       />
//     </main>
//   );
// }

"use client";

import { useState } from "react";

import { Button, CircularProgress, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import PdfViewer from "@/components/pdf/PdfViewer";
import SignatureDialog from "@/components/signature/SignatureDialog";
import SignatureProgress from "@/components/signature/SignatureProgress";

import { usePdf } from "@/hooks/usePdf";

import { downloadPdf } from "@/lib/pdf/downloadPdf";
import { signPdf } from "@/lib/pdf/signPdf";

import type { SignatureField } from "@/types/signature";

const PageRoot = styled("main")(({ theme }) => ({
  minHeight: "100vh",
  color: theme.palette.text.primary,
}));

const StateRoot = styled("main")(({ theme }) => ({
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

const FileInput = styled("input")({
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

const Header = styled("header")(({ theme }) => ({
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

const HeaderContent = styled("div")(({ theme }) => ({
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

const HeaderActions = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

const Content = styled("div")(({ theme }) => ({
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

  /*
   * Determines whether the currently selected
   * signature field is being signed for the
   * first time or being re-signed.
   */
  const [isResigning, setIsResigning] = useState(false);

  /*
   * Detect signature fields from the uploaded PDF.
   */
  const {
    signatureFields: detectedSignatureFields,
    loading,
    error,
  } = usePdf(file);

  /*
   * Local editable signature state.
   */
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);

  /*
   * If we have modified fields, use them.
   * Otherwise use the detected fields.
   */
  const displayedFields =
    signatureFields.length > 0 ? signatureFields : detectedSignatureFields;

  /*
   * Upload PDF.
   */
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      alert("Please select a PDF file.");

      return;
    }

    /*
     * Reset all signing state when
     * a new document is selected.
     */
    setSignatureFields([]);

    setActiveSignatureField(null);

    setIsResigning(false);

    setFile(selectedFile);
  }

  /*
   * User clicked a signature field.
   *
   * This function works for BOTH:
   *
   * pending field  -> normal signing
   *
   * signed field   -> re-signing
   */
  function handleSignatureClick(field: SignatureField) {
    const alreadySigned = field.status === "signed" && !!field.signatureDataUrl;

    setIsResigning(alreadySigned);

    setActiveSignatureField(field);
  }

  /*
   * Signature pad completed.
   *
   * IMPORTANT:
   *
   * We do not create another field.
   *
   * We update the exact existing field.
   *
   * Therefore this same function handles:
   *
   * first signature
   * AND
   * re-signature.
   */
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

          /*
           * A field is signed after
           * completing the signature pad.
           */
          status: "signed",

          /*
           * Replace the previous signature.
           *
           * This is the actual re-sign operation.
           */
          signatureDataUrl,
        };
      });
    });

    /*
     * Close dialog.
     */
    setActiveSignatureField(null);

    /*
     * Reset mode.
     */
    setIsResigning(false);
  }

  /*
   * Cancel signature / re-sign.
   *
   * IMPORTANT:
   *
   * We don't modify the existing field.
   *
   * So if the user opens re-sign and
   * cancels, the old signature remains.
   */
  function handleSignatureCancel() {
    setActiveSignatureField(null);
    setIsResigning(false);
  }

  /*
   * Generate filename.
   */
  function getSignedFilename(originalFilename: string) {
    const lastDot = originalFilename.lastIndexOf(".");

    if (lastDot === -1) {
      return `${originalFilename}-signed.pdf`;
    }

    return `${originalFilename.slice(0, lastDot)}-signed.pdf`;
  }

  /*
   * Generate the final PDF.
   *
   * signPdf() always starts from the ORIGINAL
   * uploaded PDF and draws the CURRENT signatures.
   *
   * This is what makes re-signing safe.
   */
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

  /*
   * No PDF selected.
   */
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
              id="pdf-upload"
              type="file"
              aria-label="Upload a PDF document"
              accept="application/pdf"
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
                type="file"
                aria-label="Choose another PDF document"
                accept="application/pdf"
                onClick={(event) => {
                  event.currentTarget.value = "";
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

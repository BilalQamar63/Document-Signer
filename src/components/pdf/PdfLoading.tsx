import { Box, styled } from "@mui/material";

type PdfLoadingProps = {
  message?: string;
};

const PdfLoadingRoot = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: theme.spacing(2),
}));

export function PdfLoading({ message = "Loading document..." }: PdfLoadingProps) {
  return (
    <PdfLoadingRoot>
      <Box>{message}</Box>
    </PdfLoadingRoot>
  );
}

export default PdfLoading;

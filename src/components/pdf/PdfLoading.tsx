type PdfLoadingProps = {
  message?: string;
};

export function PdfLoading({ message = "Loading document..." }: PdfLoadingProps) {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: 240, color: "#4b5563", fontWeight: 600 }}>
      <div>{message}</div>
    </div>
  );
}

export default PdfLoading;

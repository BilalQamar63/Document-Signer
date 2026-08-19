export const SIGNATURE_KEYWORDS = [
  "signature",
  "signatures",
  "sign here",
  "signed by",
  "sign by",
  "authorized signature",
  "authorised signature",
  "applicant signature",
  "employee signature",
  "employer signature",
  "client signature",
  "customer signature",
  "witness signature",
  "signature of",
  "digital signature",
] as const;

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function findSignatureKeyword(text: string): string | null {
  const normalized = normalizeText(text);

  const keyword = SIGNATURE_KEYWORDS.find((candidate) =>
    normalized.includes(candidate),
  );

  return keyword ?? null;
}

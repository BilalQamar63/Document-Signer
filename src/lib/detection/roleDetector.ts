import type { PdfTextItem } from "@/types/pdf";
const ROLES = [
  "lender",
  "borrower",
  "employee",
  "employer",
  "applicant",
  "client",
  "customer",
  "witness",
  "tenant",
  "landlord",
  "seller",
  "buyer",
  "owner",
  "authorized representative",
  "authorised representative",
];
export function isSignerRole(text: string): boolean {
  const value = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/:$/, "");
  return ROLES.some((role) => value === role || value.startsWith(`${role} `));
}
export function findRoles(items: PdfTextItem[]): PdfTextItem[] {
  return items.filter((item) => isSignerRole(item.text));
}

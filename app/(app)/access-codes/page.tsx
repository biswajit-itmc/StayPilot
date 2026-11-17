import type { Metadata } from "next";
import { AccessCodesView } from "@/components/smart-operations/access-codes-view";

export const metadata: Metadata = { title: "Access Codes" };

export default function AccessCodesPage() {
  return <AccessCodesView />;
}

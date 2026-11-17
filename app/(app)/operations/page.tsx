import type { Metadata } from "next";
import { OperationsView } from "@/components/smart-operations/operations-view";

export const metadata: Metadata = { title: "Operations" };

export default function OperationsPage() {
  return <OperationsView />;
}

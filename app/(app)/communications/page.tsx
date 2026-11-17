import type { Metadata } from "next";
import { CommunicationsView } from "@/components/smart-operations/communications-view";

export const metadata: Metadata = { title: "Communications" };

export default function CommunicationsPage() {
  return <CommunicationsView />;
}

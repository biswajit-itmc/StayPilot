import type { Metadata } from "next";
import { SmartLocksView } from "@/components/smart-operations/smart-locks-view";

export const metadata: Metadata = { title: "Smart Locks" };

export default function SmartLocksPage() {
  return <SmartLocksView />;
}

import type { Metadata } from "next";
import { RoomsView } from "@/components/rooms/rooms-view";

export const metadata: Metadata = { title: "Rooms & Units" };

export default function RoomsPage() {
  return <RoomsView />;
}

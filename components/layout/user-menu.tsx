"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, UserCog, UserRound } from "lucide-react";
import { toast } from "sonner";
import { DEMO_ADMIN, signOutDemo } from "@/lib/demo-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const currentUser = { name: DEMO_ADMIN.name, role: "Super Admin", email: DEMO_ADMIN.email, initials: DEMO_ADMIN.initials };

export function UserMenu() {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${currentUser.initials}, account menu for ${currentUser.name}`}
        className="rounded-full"
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-sage text-xs font-semibold text-charcoal">{currentUser.initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2">
            <span className="block text-label !text-charcoal">{currentUser.name}</span>
            <span className="block text-meta">{currentUser.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <UserRound /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/users" />}>
          <UserCog /> Users &amp; roles
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOutDemo();
            toast.success("Signed out of the demo workspace");
            router.replace("/login");
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

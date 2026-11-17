import type { Metadata } from "next";
import { DemoLoginForm } from "@/components/auth/demo-login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-10">
      <div className="w-full max-w-sm">
        <DemoLoginForm />
      </div>
    </main>
  );
}

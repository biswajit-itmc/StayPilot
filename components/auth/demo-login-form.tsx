"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";
import { DEMO_ADMIN, signInDemo, hasDemoSession } from "@/lib/demo-auth";

export function DemoLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(DEMO_ADMIN.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasDemoSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!signInDemo(email, password)) {
      setError("The email or password is incorrect. Use the demo admin credentials below.");
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-card">
      <Logo />
      <div>
        <h1 className="text-page-title">Sign in</h1>
        <p className="mt-1 text-body text-muted-foreground">Access the StayPilot demo workspace.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-label">Email</span>
          <Input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-label">Password</span>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
          />
        </label>
        {error && <p id="login-error" role="alert" className="text-body text-destructive">{error}</p>}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>

      <div className="space-y-1 rounded-xl border border-border bg-background p-4">
        <p className="text-label">Demo admin credentials</p>
        <p className="text-body">Email: <code>{DEMO_ADMIN.email}</code></p>
        <p className="text-body">Password: <code>{DEMO_ADMIN.password}</code></p>
      </div>
      <p className="text-meta">
        Demo-only sign-in. Authentication is stored in this browser tab and is not production security.
      </p>
    </section>
  );
}

export const DEMO_ADMIN = {
  email: "admin@staypilot.demo",
  password: "StayPilotDemo2026!",
  name: "Sofia Almeida",
  initials: "SA",
} as const;

const SESSION_KEY = "staypilot-demo-authenticated";
const SESSION_CHANGE_EVENT = "staypilot-demo-auth-change";

export function signInDemo(email: string, password: string) {
  const isValid =
    email.trim().toLowerCase() === DEMO_ADMIN.email &&
    password === DEMO_ADMIN.password;

  if (isValid) {
    window.sessionStorage.setItem(SESSION_KEY, "true");
    window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
  }

  return isValid;
}

export function hasDemoSession() {
  return window.sessionStorage.getItem(SESSION_KEY) === "true";
}

export function signOutDemo() {
  window.sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function subscribeToDemoSession(onChange: () => void) {
  window.addEventListener(SESSION_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, onChange);
}

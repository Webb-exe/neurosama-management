import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </>
  );
}
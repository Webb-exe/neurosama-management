import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

type User = {
  _id: Id<"users">;
  clerkInfoId: Id<"clerkInfo">;
  role: "owner" | "admin" | "member";
};

type AuthStatus =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "checking" }
  | { status: "approved"; user: User }
  | { status: "waitlisted" }
  | { status: "not_allowed" };

type AuthContextType = {
  authStatus: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  user: User | null;
  refreshAuth: () => Promise<void>;
  clerkInfo: ReturnType<typeof useClerk>["user"];

};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkInfo } = useClerk();
  const authStatusResult = useQuery(
    api.users.getAuthStatus,
    isLoaded && isSignedIn ? {} : "skip"
  );
  const ensureUserRegistered = useMutation(api.users.ensureUserRegistered);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ status: "loading" });
  const isRegistering = useRef(false);

  // Handle registration when status is pending
  useEffect(() => {
    async function handlePendingRegistration() {
      if (
        authStatusResult?.status === "pending" &&
        !isRegistering.current
      ) {
        isRegistering.current = true;
        try {
          const result = await ensureUserRegistered();
          if (result.status === "approved") {
            setAuthStatus({ status: "approved", user: result.user });
          } else if (result.status === "waitlisted") {
            setAuthStatus({ status: "waitlisted" });
          } else {
            setAuthStatus({ status: "not_allowed" });
          }
        } catch (error) {
          console.error("Registration failed:", error);
          setAuthStatus({ status: "not_allowed" });
        } finally {
          isRegistering.current = false;
        }
      }
    }
    handlePendingRegistration();
  }, [authStatusResult, ensureUserRegistered]);

  // Map query result to auth status
  useEffect(() => {
    if (!isLoaded) {
      setAuthStatus({ status: "loading" });
      return;
    }

    if (!isSignedIn) {
      setAuthStatus({ status: "unauthenticated" });
      return;
    }

    if (authStatusResult === undefined) {
      setAuthStatus({ status: "checking" });
      return;
    }

    // Handle the query result (pending is handled by the registration effect)
    if (authStatusResult.status === "approved") {
      setAuthStatus({ status: "approved", user: authStatusResult.user });
    } else if (authStatusResult.status === "waitlisted") {
      setAuthStatus({ status: "waitlisted" });
    } else if (authStatusResult.status === "not_authenticated") {
      setAuthStatus({ status: "unauthenticated" });
    } else if (authStatusResult.status === "pending") {
      // Pending state - registration effect will handle this
      setAuthStatus({ status: "checking" });
    }
  }, [isLoaded, isSignedIn, authStatusResult]);

  const refreshAuth = useCallback(async () => {
    // With useQuery, the data is automatically refreshed
    // This function is kept for API compatibility
    // Force a re-check by triggering the registration flow if needed
    if (authStatusResult?.status === "pending" && !isRegistering.current) {
      isRegistering.current = true;
      try {
        const result = await ensureUserRegistered();
        if (result.status === "approved") {
          setAuthStatus({ status: "approved", user: result.user });
        } else if (result.status === "waitlisted") {
          setAuthStatus({ status: "waitlisted" });
        } else {
          setAuthStatus({ status: "not_allowed" });
        }
      } catch (error) {
        console.error("Registration failed:", error);
        setAuthStatus({ status: "not_allowed" });
      } finally {
        isRegistering.current = false;
      }
    }
  }, [authStatusResult, ensureUserRegistered]);

  const isLoading = authStatus.status === "loading" || authStatus.status === "checking";
  const isAuthenticated = isSignedIn === true;
  const isApproved = authStatus.status === "approved";
  const user = authStatus.status === "approved" ? authStatus.user : null;

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        isLoading,
        isAuthenticated,
        isApproved,
        user,
        refreshAuth,
        clerkInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

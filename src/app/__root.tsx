import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { AuthProvider } from "@/context/AuthContext";
import { TimezoneProvider } from "@/context/TimezoneContext";
import appCss from "./globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Robotics Team Manager" },
      { name: "description", content: "Manage your robotics team" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/convex.svg",
      },
    ],
  }),
  component: RootLayout,
  notFoundComponent: NotFound,
});

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link to="/" className="text-primary hover:underline">
        Go back home
      </Link>
    </div>
  );
}

function RootLayout() {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ClerkProvider publishableKey={clerkPubKey!}>
          <ConvexClientProvider>
            <TimezoneProvider>
              <AuthProvider>
                <Outlet />
              </AuthProvider>
            </TimezoneProvider>
          </ConvexClientProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}

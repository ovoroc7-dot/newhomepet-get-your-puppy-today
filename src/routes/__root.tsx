import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">This puppy wandered off.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">Back home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Evan Lynn Kate Veterinary Clinic — Fluffy's Health | Find your new best friend" },
      { name: "description", content: "Evan Lynn Kate Veterinary Clinic with Fluffy's Health — adopt healthy, happy puppies from trusted breeders. Browse available puppies and bring one home today." },
      { property: "og:title", content: "Evan Lynn Kate Veterinary Clinic — Fluffy's Health | Find your new best friend" },
      { property: "og:description", content: "Evan Lynn Kate Veterinary Clinic with Fluffy's Health — adopt healthy, happy puppies from trusted breeders. Browse available puppies and bring one home today." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Evan Lynn Kate Veterinary Clinic — Fluffy's Health | Find your new best friend" },
      { name: "twitter:description", content: "Evan Lynn Kate Veterinary Clinic with Fluffy's Health — adopt healthy, happy puppies from trusted breeders. Browse available puppies and bring one home today." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49b043b3-fe15-4a0a-9420-3b69407bc085/id-preview-51ebda1b--d496015d-4782-456f-9411-7c20e528718a.lovable.app-1784250976168.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/49b043b3-fe15-4a0a-9420-3b69407bc085/id-preview-51ebda1b--d496015d-4782-456f-9411-7c20e528718a.lovable.app-1784250976168.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
        <Link to="/" aria-label="Evan Lynn Kate Veterinary Clinic home" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🐾</span>
          <span className="font-display text-lg font-semibold sm:text-xl">Evan Lynn Kate Veterinary Clinic</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[92%] sm:w-96 overflow-y-auto p-0">
            <SheetTitle asChild><VisuallyHidden>Site navigation</VisuallyHidden></SheetTitle>
            <MenuPanel onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

type MenuGroup = { label: string; children: { label: string; to?: string; href?: string }[] };

const MENU_GROUPS: MenuGroup[] = [
  { label: "Breeds", children: [
    { label: "Cavapoos", href: "/#puppies" },
    { label: "French Bulldogs", href: "/#puppies" },
    { label: "Poodles", href: "/#puppies" },
    { label: "Dachshunds", href: "/#puppies" },
    { label: "See All", href: "/#puppies" },
  ]},
  { label: "Health", children: [
    { label: "Health Guarantee", href: "/about" },
    { label: "AKC Benefits", href: "/about" },
  ]},
  { label: "Resources", children: [
    { label: "About", to: "/about" },
  ]},
  { label: "Breeder Standards", children: [
    { label: "About", to: "/about" },
  ]},
];

function MenuPanel({ onNavigate }: { onNavigate: () => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
        <span className="text-2xl" aria-hidden="true">🐾</span>
        <span className="font-display text-xl font-semibold text-primary">Evan Lynn Kate Veterinary Clinic</span>
      </div>
      <nav aria-label="Main" className="flex-1 px-2 py-3 text-base">
        <Link to="/about" onClick={onNavigate} className="flex min-h-11 items-center justify-between rounded-lg px-4 py-3 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          Our Story <ChevronRight className="h-5 w-5 opacity-60" aria-hidden="true" />
        </Link>
        <a href="/#puppies" onClick={onNavigate} className="flex min-h-11 items-center justify-between rounded-lg px-4 py-3 hover:bg-secondary">
          Testimonials
        </a>
        {MENU_GROUPS.map((g) => {
          const isOpen = openGroup === g.label;
          return (
            <div key={g.label}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenGroup(isOpen ? null : g.label)}
                className="flex min-h-11 w-full items-center justify-between rounded-lg px-4 py-3 text-left hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className={isOpen ? "font-semibold" : ""}>{g.label}</span>
                {isOpen ? <ChevronDown className="h-5 w-5 opacity-60" aria-hidden="true" /> : <ChevronRight className="h-5 w-5 opacity-60" aria-hidden="true" />}
              </button>
              {isOpen && (
                <div className="ml-4 flex flex-col border-l border-border/60">
                  {g.children.map((c) => (
                    c.to ? (
                      <Link key={c.label} to={c.to} onClick={onNavigate} className="min-h-11 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                        {c.label}
                      </Link>
                    ) : (
                      <a key={c.label} href={c.href} onClick={onNavigate} className="min-h-11 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                        {c.label}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <Link to="/admin" onClick={onNavigate} className="mt-2 flex min-h-11 items-center justify-between rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          Admin
        </Link>
      </nav>
      <div className="border-t border-border/60 px-5 py-5">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">Welcome to Evan Lynn Kate Veterinary Clinic.</span> With Fluffy's Health, explore our beautiful, healthy puppies and find a loving companion ready for a new home.
        </p>
      </div>
    </div>
  );
}

function SiteFooter() {
  const phoneDisplay = "+1 (281) 628-3530";
  const phoneE164 = "+12816283530";
  const waNumber = "12816283530";
  const email = "vernasewak5805@hotmail.com";
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <div className="font-display text-lg text-foreground">Evan Lynn Kate Veterinary Clinic</div>
            <p className="mt-1">Bringing families and puppies together. <span className="text-primary font-medium">Fluffy's Health</span></p>
          </div>
          <div>
            <div className="font-display text-base font-semibold text-foreground">Contact Support</div>
            <div className="mt-2 space-y-2">
              <a href={`mailto:${email}`} className="flex min-h-11 items-center gap-2 text-foreground hover:text-primary">
                <span aria-hidden="true">✉️</span> {email}
              </a>
              <div className="flex flex-wrap items-center gap-2">
                <a href={`tel:${phoneE164}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                  📞 {phoneDisplay}
                </a>
                <a href={`sms:${phoneE164}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                  💬 Text
                </a>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border/60 pt-4 text-xs">© {new Date().getFullYear()} Evan Lynn Kate Veterinary Clinic. All rights reserved.</div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1"><Outlet /></main>
        <SiteFooter />
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

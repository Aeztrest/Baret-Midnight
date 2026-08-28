import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Github, Moon, ShieldHalf, Sun } from "lucide-react";

export function Container({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </div>
  );
}

export function BaretMark({ size = 22 }: { size?: number }) {
  return <ShieldHalf size={size} strokeWidth={2.25} className="text-primary" />;
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("baret-theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    window.localStorage.setItem("baret-theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/demo", label: "Live demo" },
  { to: "/showcase", label: "Threat gallery" },
  { to: "/docs", label: "Docs" },
  { to: "/install", label: "Install" },
];

export function Header() {
  const { dark, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <BaretMark />
          Baret
          <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
            for Midnight
          </span>
        </Link>
        <nav className="hidden items-center gap-6 font-mono text-sm sm:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `transition-colors hover:text-foreground ${isActive ? "text-foreground" : "text-muted"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Aeztrest/Baret-Midnight"
            target="_blank"
            rel="noreferrer"
            className="text-muted transition-colors hover:text-foreground"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
          <button
            onClick={toggle}
            className="rounded-md border border-border p-1.5 text-muted transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </Container>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <Container className="flex flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <BaretMark size={16} />
          <span>Baret for Midnight — built for Midnight's privacy architecture, from scratch.</span>
        </div>
        <a href="https://github.com/Aeztrest/Baret-Midnight" target="_blank" rel="noreferrer" className="hover:text-foreground">
          Source on GitHub
        </a>
      </Container>
    </footer>
  );
}

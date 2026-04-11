"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SidebarNavProps = {
  displayName: string;
  email: string | null;
  image: string | null;
  initials: string;
  subscriptionStatus: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
};

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.75L12 4L20 10.75V19A1 1 0 0 1 19 20H14V14H10V20H5A1 1 0 0 1 4 19V10.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19V19H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 19H7.5A2.5 2.5 0 0 0 5 21.5M9 7H15M9 11H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 8.75A3.25 3.25 0 1 1 8.75 12A3.25 3.25 0 0 1 12 8.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15A1 1 0 0 0 19.6 16.1L19.65 16.15A1 1 0 0 1 19.65 17.56L17.56 19.65A1 1 0 0 1 16.15 19.65L16.1 19.6A1 1 0 0 0 15 19.4A1 1 0 0 0 14.4 20.32V20.5A1 1 0 0 1 13.4 21.5H10.6A1 1 0 0 1 9.6 20.5V20.32A1 1 0 0 0 9 19.4A1 1 0 0 0 7.9 19.6L7.85 19.65A1 1 0 0 1 6.44 19.65L4.35 17.56A1 1 0 0 1 4.35 16.15L4.4 16.1A1 1 0 0 0 4.6 15A1 1 0 0 0 3.68 14.4H3.5A1 1 0 0 1 2.5 13.4V10.6A1 1 0 0 1 3.5 9.6H3.68A1 1 0 0 0 4.6 9A1 1 0 0 0 4.4 7.9L4.35 7.85A1 1 0 0 1 4.35 6.44L6.44 4.35A1 1 0 0 1 7.85 4.35L7.9 4.4A1 1 0 0 0 9 4.6A1 1 0 0 0 9.6 3.68V3.5A1 1 0 0 1 10.6 2.5H13.4A1 1 0 0 1 14.4 3.5V3.68A1 1 0 0 0 15 4.6A1 1 0 0 0 16.1 4.4L16.15 4.35A1 1 0 0 1 17.56 4.35L19.65 6.44A1 1 0 0 1 19.65 7.85L19.6 7.9A1 1 0 0 0 19.4 9A1 1 0 0 0 20.32 9.6H20.5A1 1 0 0 1 21.5 10.6V13.4A1 1 0 0 1 20.5 14.4H20.32A1 1 0 0 0 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12H9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5h.01M12 12h.01M12 19h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const navItems: NavItem[] = [
  {
    href: "/app",
    label: "Accueil",
    icon: <HomeIcon />,
    isActive: (pathname) => pathname === "/app",
  },
  {
    href: "/library",
    label: "Bibliothèque",
    icon: <LibraryIcon />,
    isActive: (pathname) => pathname.startsWith("/library"),
  },
  {
    href: "/settings",
    label: "Paramètres",
    icon: <SettingsIcon />,
    isActive: (pathname) => pathname.startsWith("/settings"),
  },
];

function getAvatarLabel(displayName: string, email: string | null) {
  if (displayName && displayName !== "Invite") {
    return displayName;
  }

  return email?.split("@")[0] ?? "Mon compte";
}

export function SidebarNav({ displayName, email, image, initials, subscriptionStatus }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const showUpgrade = subscriptionStatus !== "active";
  const avatarLabel = getAvatarLabel(displayName, email);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div
      className="sidebar-nav"
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "24px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <Link
            href="/app"
            style={{
              color: "#FFFFFF",
              textDecoration: "none",
              fontFamily: "var(--display-font)",
              fontSize: "1.6rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
            }}
          >
            REVIZ
          </Link>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            const baseStyle = {
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "8px",
              textDecoration: "none",
              fontFamily: "var(--display-font)",
              fontWeight: 600,
              transition: "background 180ms ease, color 180ms ease",
            } as const;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...baseStyle,
                  color: active ? "#FFFFFF" : "#8B8B9E",
                  background: active ? "#3B5BDB" : "transparent",
                }}
                onMouseEnter={(event) => {
                  if (!active) {
                    event.currentTarget.style.color = "#FFFFFF";
                    event.currentTarget.style.background = "#252532";
                  }
                }}
                onMouseLeave={(event) => {
                  if (!active) {
                    event.currentTarget.style.color = "#8B8B9E";
                    event.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ display: "inline-flex" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto" }}>
        {showUpgrade ? (
          <div
            style={{
              background: "#252532",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #2A2A38",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#FFFFFF",
                  fontFamily: "var(--display-font)",
                  fontSize: "1rem",
                }}
              >
                Passe Premium
              </h2>
              <p style={{ margin: "6px 0 0", color: "#8B8B9E", fontSize: "0.92rem" }}>
                Génère en illimité
              </p>
            </div>

            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "42px",
                padding: "0 14px",
                borderRadius: "8px",
                background: "#3B5BDB",
                color: "#FFFFFF",
                textDecoration: "none",
                fontFamily: "var(--display-font)",
                fontWeight: 700,
              }}
            >
              Upgrade →
            </Link>
          </div>
        ) : null}

        <div
          ref={menuRef}
          style={{
            marginTop: "auto",
            padding: "12px",
            borderTop: "1px solid #1E1E2A",
            cursor: "pointer",
            position: "relative",
          }}
        >
          {menuOpen ? (
            <div
              style={{
                position: "absolute",
                bottom: "60px",
                left: "12px",
                background: "#1E1E2A",
                border: "1px solid #2A2A38",
                borderRadius: "12px",
                padding: "8px",
                minWidth: "180px",
                zIndex: 50,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#252532";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                }}
              >
                <SettingsIcon />
                <span>Paramètres</span>
              </button>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: "/sign-in" })}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  color: "#ef4444",
                  fontSize: "13px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#252532";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "transparent";
                }}
              >
                <LogoutIcon />
                <span>Se déconnecter</span>
              </button>
            </div>
          ) : null}

          <div
            onClick={() => setMenuOpen((current) => !current)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px",
              borderRadius: "8px",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "#1E1E2A";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
            }}
          >
            {image ? (
              <img
                src={image}
                alt={avatarLabel}
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#3B5BDB",
                  color: "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                }}
              >
                {initials}
              </div>
            )}

            <span
              style={{
                fontSize: "13px",
                color: "#FFFFFF",
                fontWeight: 600,
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {avatarLabel}
            </span>

            <span style={{ color: "#8B8B9E", display: "inline-flex" }}>
              <MoreIcon />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

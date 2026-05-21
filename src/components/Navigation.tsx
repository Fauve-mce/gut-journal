"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "🏠 Dashboard" },
  { href: "/meals", label: "🍽️ Repas" },
  { href: "/stools", label: "🚽 Selles" },
  { href: "/symptoms", label: "😣 Symptômes" },
  { href: "/insights", label: "📊 Corrélations" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around py-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-xs flex flex-col items-center gap-1 ${
            pathname === link.href
              ? "text-black font-bold"
              : "text-zinc-400"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

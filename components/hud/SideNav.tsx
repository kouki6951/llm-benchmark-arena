"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "DASHBOARD", jp: "ダッシュボード" },
  { href: "/cases", label: "CASES", jp: "評価テーマ" },
  { href: "/models", label: "MODELS", jp: "モデル管理" },
  { href: "/runs", label: "RUNS", jp: "実行履歴" },
  { href: "/settings", label: "SETTINGS", jp: "設定" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 border-r border-border bg-base/60">
      <ul className="flex flex-col gap-1 p-2">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`group flex items-center gap-2 border-l-2 px-3 py-2 transition-all ${
                  active
                    ? "border-accent bg-accent/5 text-accent shadow-glow"
                    : "border-transparent text-text-muted hover:border-accent/50 hover:text-text-primary"
                }`}
              >
                <span
                  className={`clip-hex h-2 w-2 ${
                    active ? "bg-accent" : "bg-border group-hover:bg-accent/50"
                  }`}
                />
                <div className="flex flex-col">
                  <span className="hud-label text-xs">{item.label}</span>
                  <span className="text-[10px] text-text-muted">{item.jp}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

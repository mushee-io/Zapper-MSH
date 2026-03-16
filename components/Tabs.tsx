"use client";

import React from "react";

export type TabKey =
  | "stake"
  | "dashboard"
  | "faucet"
  | "cards"
  | "spin"
  | "hub"
  | "ready"
  | "links";

const items: { key: TabKey; label: string }[] = [
  { key: "stake", label: "Stake" },
  { key: "dashboard", label: "Dashboard" },
  { key: "faucet", label: "Faucet" },
  { key: "cards", label: "Bitcoin Cards" },
  { key: "spin", label: "Spin the Wheel" },
  { key: "hub", label: "Trading Hub" },
  { key: "ready", label: "Ready Wallet" },
  { key: "links", label: "Links" }
];

export function Tabs({
  active,
  onChange
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <button
            key={it.key}
            className={["btn", isActive ? "bg-black text-white border-black" : "bg-white"].join(" ")}
            onClick={() => onChange(it.key)}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

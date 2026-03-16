import React from "react";

export function Section({
  title,
  subtitle,
  children,
  right
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="card p-6 md:p-7">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-black/60 mt-1">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="rule my-5" />
      {children}
    </div>
  );
}

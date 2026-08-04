"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ReportColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => string;
  align?: "left" | "right";
};

export function ReportTable<T>({
  title,
  description,
  columns,
  rows,
  filename,
  summary,
}: {
  title: string;
  description?: string;
  columns: ReportColumn<T>[];
  rows: T[];
  filename: string;
  summary?: { label: string; value: string }[];
}) {
  function exportCsv() {
    const header = columns.map((c) => c.label);
    const body = rows.map((r) => columns.map((c) => c.render(r)));
    const csv = [header, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy-800">{title}</h2>
          {description && <p className="text-sm text-grey-500">{description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="hidden print:block">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-grey-500">{description}</p>}
      </div>

      {summary && summary.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
          {summary.map((s) => (
            <div key={s.label} className="rounded-xl border border-grey-100 bg-grey-50/60 p-3">
              <p className="text-[11px] text-grey-400">{s.label}</p>
              <p className="font-display text-base font-semibold text-navy-800">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-grey-100">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-grey-100 bg-grey-50/60 text-left text-xs text-grey-400">
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-2.5 font-medium ${c.align === "right" ? "text-right" : ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-grey-400">
                  No data for this report.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-b border-grey-50 last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-2.5 text-navy-700 ${c.align === "right" ? "text-right" : ""}`}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

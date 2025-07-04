/* ─────────────────── /documents/page.tsx ─────────────────── */
"use client";

import { Fragment, useEffect, useState } from "react";
import axios from "axios";
import { useDocStore } from "@/stores/doc-store";
import { Dialog, DialogTrigger, DialogHeader, DialogTitle, DialogContent2 } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText } from "lucide-react";
import { DataTable } from "./data-table";
import type { docid } from "@/types";

/* ---------- helpers ---------- */
const buildPdfSrc = (url: string) => {
  const [base, hash] = url.split("#");
  const flags = "toolbar=0&navpanes=0&scrollbar=0&view=FitH";
  return `${base}#${hash ? `${hash}&` : ""}${flags}`;
};

function applyColumnOrder<T extends Record<string, unknown>>(rows: T[], columnOrder: string[] | undefined): T[] {
  if (!columnOrder?.length) return rows;
  return rows.map((row) => {
    const ordered: Record<string, unknown> = {};
    columnOrder.forEach((k) => k in row && (ordered[k] = row[k]));
    Object.keys(row).forEach((k) => !(k in ordered) && (ordered[k] = row[k]));
    return ordered as T;
  });
}

/* ---------- (generic) renderer for 2‑level table hierarchies ---------- */
type TableBlock = { columnOrder: string[]; rows: Record<string, unknown>[] };
type SubTableGroup = { subTableOrder: string[] } & Record<string, TableBlock>;
type TableRoot = { tableOrder: string[] } & Record<string, SubTableGroup | TableBlock>;

function renderTableRoot(root: TableRoot | undefined, sectionTitle: string) {
  if (!root?.tableOrder?.length) return null;

  return (
    <>
      <h3 className="text-xl font-semibold text-center">{sectionTitle}</h3>

      {root.tableOrder.map((catKey) => {
        const cat = root[catKey] as SubTableGroup | TableBlock | undefined;
        if (!cat) return null;

        /* 1️⃣  Category contains subtables (most asset / tx cases) */
        if ("subTableOrder" in cat && Array.isArray(cat.subTableOrder)) {
          return (
            <Fragment key={catKey}>
              <h4 className="font-semibold text-center mt-4">{catKey.replace(/_/g, " ")}</h4>
              {cat.subTableOrder.map((subKey) => {
                const tbl = cat[subKey] as TableBlock | undefined;
                if (!tbl?.rows?.length) return null;
                const rows = applyColumnOrder(tbl.rows, tbl.columnOrder);
                return <DataTable key={`${catKey}-${subKey}`} title={subKey.replace(/_/g, " ")} rows={rows} />;
              })}
            </Fragment>
          );
        }

        /* 2️⃣  Category itself is a single table (edge‑case fallback) */
        if ((cat as TableBlock).rows?.length) {
          const tbl = cat as TableBlock;
          const rows = applyColumnOrder(tbl.rows, tbl.columnOrder);
          return <DataTable key={catKey} title={catKey.replace(/_/g, " ")} rows={rows} />;
        }
        return null;
      })}
    </>
  );
}

/* ---------- API‑level types (minimal; extend as required) ---------- */
interface PortfolioDocument {
  PK: string;
  bank_name: string;
  pdf_url: string;
  excel_report_url: string | null;
  assets?: TableRoot;
  transactions?: TableRoot;
}

/* ---------- Page ---------- */
export default function DocumentsMergedPage() {
  const docids: docid[] = useDocStore((s) => s.docids);
  const [docs, setDocs] = useState<PortfolioDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  /* fetch whenever id list changes */
  useEffect(() => {
    if (!docids.length) {
      setDocs([]);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const dummy: docid[] = [
          { PK: "doc", SK: "1751537347798_1" },
          { PK: "doc", SK: "1751537347798_2" },
        ];
        const { data } = await axios.post<{ items: (PortfolioDocument | null)[] }>(
          "/api/get-documents",
          { keys: dummy } // <‑‑ replace dummy `dev` array
        );
        setDocs((data.items ?? []).filter(Boolean) as PortfolioDocument[]);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [docids]);

  /* ---------- render states ---------- */
  if (loading) return <p className="p-6">Loading…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;
  if (!docs.length) return <p className="p-6 text-gray-500">No documents to display.</p>;

  const filtered = docs.filter((d) => (d.bank_name ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="p-6">
      {/* quick search */}
      <div className="mb-6 max-w-md">
        <Input placeholder="Search by bank name…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No matching documents found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((doc, idx) => (
            <Dialog key={idx}>
              {/* ───────── trigger row ───────── */}
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{doc.bank_name || doc.PK || `Document ${idx + 1}`}</span>
                </Button>
              </DialogTrigger>

              {/* ───────── dialog content ───────── */}
              <DialogContent2>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 mb-4 w-1/3 mx-auto my-4"
                  onClick={() => doc.excel_report_url && window.open(doc.excel_report_url)}
                  disabled={!doc.excel_report_url}
                >
                  <Download className="h-4 w-4" />
                  Download Excel
                </Button>

                <DialogHeader className="p-4 hidden">
                  <DialogTitle className="truncate">{doc.bank_name}</DialogTitle>
                </DialogHeader>

                {/* ───────── split view ───────── */}
                <div className="flex flex-1 overflow-hidden">
                  {/* left ‑ pdf */}
                  <div className="flex flex-col overflow-y-auto lg:basis-1/2 lg:pr-3 mb-6 lg:mb-0 min-w-0">
                    <span className="mb-2 text-xl font-semibold truncate text-center">{doc.bank_name}</span>

                    {doc.pdf_url ? (
                      <iframe
                        src={buildPdfSrc(doc.pdf_url)}
                        className="flex-1 w-full border-0 bg-white"
                        allowFullScreen
                      />
                    ) : (
                      <div className="flex items-center justify-center flex-1 text-gray-500">No PDF available</div>
                    )}
                  </div>

                  {/* right ‑ tables */}
                  <div className="flex flex-col overflow-y-auto lg:basis-1/2 lg:pl-3 space-y-6 min-w-0">
                    {renderTableRoot(doc.assets, "Assets")}
                    {renderTableRoot(doc.transactions, "Transactions")}
                  </div>
                </div>
              </DialogContent2>
            </Dialog>
          ))}
        </div>
      )}
    </main>
  );
}

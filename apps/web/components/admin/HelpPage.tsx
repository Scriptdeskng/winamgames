"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import {
  getAdminHelpContent,
  requireAdminSession,
  type AdminHelpArticle,
  type AdminHelpBlock,
  type AdminHelpItem,
  type AdminHelpRow,
} from "@/lib/api";

function WarningCallout({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function InfoCallout({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-xs leading-relaxed text-muted-foreground">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function RowTable({ rows }: { rows: AdminHelpRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="grid grid-cols-[minmax(160px,200px)_minmax(110px,140px)_1fr] border-b border-border bg-surface-2 px-3 py-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        <div>Name</div>
        <div>Type</div>
        <div>Description</div>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.name}
            className="grid grid-cols-[minmax(160px,200px)_minmax(110px,140px)_1fr] gap-3 px-3 py-2 text-xs"
          >
            <div>
              <div className="font-mono font-semibold text-foreground">
                {row.name}
              </div>
              {(row.default ?? row.defaultVal) && (
                <div className="mt-1 inline-block rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  Default: {row.default ?? row.defaultVal}
                </div>
              )}
            </div>
            <div className="text-muted-foreground">{row.type}</div>
            <div className="leading-relaxed text-muted-foreground">
              {row.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridItem({ item }: { item: AdminHelpItem }) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <h4 className="mb-2 text-sm font-semibold text-foreground">{item.title}</h4>
      {item.text && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {item.text}
        </p>
      )}
      {item.steps && item.steps.length > 0 && <StepList steps={item.steps} />}
      {item.list && item.list.length > 0 && (
        <ul className="list-none space-y-1 text-xs text-muted-foreground">
          {item.list.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function renderBlock(block: AdminHelpBlock, index: number): ReactNode {
  switch (block.type) {
    case "section":
      return (
        <Section key={`${block.type}-${index}`} title={block.title}>
          {block.text && (
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {block.text}
            </p>
          )}
          {block.info && <InfoCallout>{block.info}</InfoCallout>}
          {block.warning && <WarningCallout>{block.warning}</WarningCallout>}
          {block.rows && block.rows.length > 0 && <RowTable rows={block.rows} />}
          {block.steps && block.steps.length > 0 && (
            <StepList steps={block.steps} />
          )}
          {block.list && block.list.length > 0 && (
            <ul className="list-none space-y-1 text-xs text-muted-foreground">
              {block.list.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          )}
          {block.grid && block.grid.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {block.grid.map((item) => (
                <GridItem key={item.title} item={item} />
              ))}
            </div>
          )}
        </Section>
      );
    case "table":
      return (
        <Section key={`${block.type}-${index}`} title={block.title ?? "Table"}>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
                <tr>
                  {block.headers.map((header) => (
                    <th
                      key={header}
                      className="px-3 py-2 text-left font-medium"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xs text-muted-foreground">
                {block.rows.map((row, rowIndex) => (
                  <tr key={`${block.title ?? "table"}-${rowIndex}`} className="border-t border-border">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${cell}-${cellIndex}`}
                        className="px-3 py-2 align-top"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.warning && <WarningCallout>{block.warning}</WarningCallout>}
        </Section>
      );
    case "steps":
      return (
        <Section key={`${block.type}-${index}`} title={block.title ?? "Steps"}>
          {block.text && (
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {block.text}
            </p>
          )}
          {block.info && <InfoCallout>{block.info}</InfoCallout>}
          {block.warning && <WarningCallout>{block.warning}</WarningCallout>}
          <StepList steps={block.steps} />
        </Section>
      );
    case "grid":
      return (
        <Section key={`${block.type}-${index}`} title={block.title ?? "Grid"}>
          {block.warning && <WarningCallout>{block.warning}</WarningCallout>}
          <div className="grid gap-3 md:grid-cols-2">
            {block.items.map((item) => (
              <GridItem key={item.title} item={item} />
            ))}
          </div>
        </Section>
      );
    case "warning":
      return <WarningCallout key={`${block.type}-${index}`}>{block.text}</WarningCallout>;
    case "info":
      return <InfoCallout key={`${block.type}-${index}`}>{block.text}</InfoCallout>;
  }
}

function ArticleContent({ article }: { article: AdminHelpArticle }) {
  return (
    <>
      {article.intro && (
        <p className="mb-4 text-sm text-muted-foreground">{article.intro}</p>
      )}
      {article.warning && <WarningCallout>{article.warning}</WarningCallout>}
      {article.blocks.map((block, index) => renderBlock(block, index))}
    </>
  );
}

export default function HelpPage() {
  const [articles, setArticles] = useState<AdminHelpArticle[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const admin = await requireAdminSession();
        const result = await getAdminHelpContent(admin.adminId);
        if (!mounted) return;
        const nextArticles = result.articles ?? [];
        setArticles(nextArticles);
        setActiveId((current) => current || nextArticles[0]?.id || "");
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load help content");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const activeArticle = useMemo(
    () => articles.find((article) => article.id === activeId) ?? articles[0] ?? null,
    [articles, activeId],
  );

  return (
    <div className="space-y-0">
      <div className="mb-0">
        <h1 className="text-2xl font-bold">Help center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guides and reference for WinamGames admin operations.
        </p>
      </div>

      <div className="mt-4 flex gap-0 border-b border-border">
        {(articles.length > 0 ? articles : []).map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => setActiveId(article.id)}
            className={`-mb-px px-4 py-2 text-sm transition-colors ${
              activeArticle?.id === article.id
                ? "border-b-2 border-primary font-medium text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {article.label}
          </button>
        ))}
      </div>

      <div className="mt-6 max-h-[calc(100dvh-14rem)] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-border bg-surface-1">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : activeArticle ? (
          <ArticleContent article={activeArticle} />
        ) : (
          <div className="rounded-md border border-border bg-surface-1 p-4 text-sm text-muted-foreground">
            No help content available.
          </div>
        )}
      </div>
    </div>
  );
}

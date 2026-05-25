"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { getPublicContent } from "@/lib/api";

interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_FAQS: Faq[] = [
  {
    id: "faq-1",
    question: "How do I earn tickets?",
    answer: "Play the game modes, solve puzzles, and complete missions to earn weekly draw tickets.",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "faq-2",
    question: "How do I claim a prize?",
    answer: "If you win, open the KYC flow, submit your identity and bank details, then wait for verification.",
    sort_order: 2,
    is_active: true,
  },
];

export default function SupportPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportWhatsapp, setSupportWhatsapp] = useState("");

  useEffect(() => {
    setFaqs(DEFAULT_FAQS);
    void getPublicContent()
      .then(({ support }) => {
        setSupportEmail(support.email ?? "");
        setSupportWhatsapp(support.whatsapp ?? "");
      })
      .catch(() => {
        setSupportEmail("");
        setSupportWhatsapp("");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[430px] flex-col bg-background">
      <TopBar backTo="/profile" title="Help & Support" />

      <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-8 pt-4 scrollbar-hidden">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Frequently asked questions
          </h2>

          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-12 rounded-xl bg-surface-1" />
              <div className="h-12 rounded-xl bg-surface-1" />
              <div className="h-12 rounded-xl bg-surface-1" />
            </div>
          ) : faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No FAQs available.</p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border border-border bg-surface-1"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId(isOpen ? null : faq.id)
                      }
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-surface-2/40"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {(supportEmail || supportWhatsapp) && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Still need help?
            </h2>

            <div className="space-y-3 rounded-2xl border border-border bg-surface-1 p-4">
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface-2/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email support</p>
                    <p className="text-xs text-muted-foreground">
                      {supportEmail}
                    </p>
                  </div>
                </a>
              )}

              {supportWhatsapp && (
                <a
                  href={`https://wa.me/${supportWhatsapp}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-surface-2/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">
                      Chat with us on WhatsApp
                    </p>
                  </div>
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

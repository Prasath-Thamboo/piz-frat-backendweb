"use client";

import { useState, useTransition } from "react";
import { createPromotionAction } from "./actions";
import { PromotionForm, type PromotionFormValues } from "./promotion-form";

export function NewPromotionForm({
  clients,
}: {
  clients: { id: string; name: string; email: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  function handleSubmit(values: PromotionFormValues) {
    setError(null);
    startTransition(async () => {
      const result = await createPromotionAction(values);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setFormKey((k) => k + 1);
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-medium text-neutral-500">Nouvelle promotion</h2>
      <PromotionForm
        key={formKey}
        clients={clients}
        pending={pending}
        error={error}
        submitLabel="Créer"
        onSubmit={handleSubmit}
      />
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { setOrderingOpenAction, setExtraDelayAction } from "./actions";

export function ServiceSettingsForm({
  orderingOpen,
  currentExtraDelayMinutes,
  activeOrdersCount,
}: {
  orderingOpen: boolean;
  currentExtraDelayMinutes: number;
  activeOrdersCount: number;
}) {
  const [open, setOpen] = useState(orderingOpen);
  const [togglePending, startToggle] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [delay, setDelay] = useState(String(currentExtraDelayMinutes));
  const [delayPending, startDelay] = useTransition();
  const [delayError, setDelayError] = useState<string | null>(null);
  const [delaySaved, setDelaySaved] = useState(false);

  function handleToggle() {
    setToggleError(null);
    const next = !open;
    startToggle(async () => {
      const result = await setOrderingOpenAction(next);
      if ("error" in result) {
        setToggleError(result.error);
        return;
      }
      setOpen(next);
    });
  }

  function handleDelaySubmit() {
    setDelayError(null);
    setDelaySaved(false);
    const minutes = Number(delay);
    if (!Number.isInteger(minutes) || minutes < 0) {
      setDelayError("Entrez un nombre de minutes positif.");
      return;
    }
    startDelay(async () => {
      const result = await setExtraDelayAction(minutes);
      if ("error" in result) {
        setDelayError(result.error);
        return;
      }
      setDelaySaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Prise de commande</p>
            <p className="text-sm text-neutral-500">
              {open
                ? "Ouverte : les clients peuvent commander."
                : "Fermée : les clients ne peuvent plus valider de commande."}
            </p>
          </div>
          <button
            type="button"
            disabled={togglePending}
            onClick={handleToggle}
            className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60 ${
              open
                ? "border-red-800 text-red-800 hover:bg-red-50"
                : "border-green-700 text-green-700 hover:bg-green-50"
            }`}
          >
            {open ? "Fermer la prise de commande" : "Rouvrir la prise de commande"}
          </button>
        </div>
        {toggleError && <p className="mt-2 text-sm text-red-700">{toggleError}</p>}
      </section>

      <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
        <div>
          <p className="font-medium">Délai supplémentaire</p>
          <p className="text-sm text-neutral-500">
            En cas de forte affluence, ajoutez des minutes au délai annoncé. Appliqué
            immédiatement aux {activeOrdersCount} commande{activeOrdersCount > 1 ? "s" : ""} en
            cours et aux prochaines commandes, jusqu&apos;à remise à zéro.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-neutral-500">Minutes</span>
            <input
              type="number"
              min={0}
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
              className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={delayPending}
            onClick={handleDelaySubmit}
            className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {delayPending ? "Application..." : "Appliquer"}
          </button>
        </div>
        {delayError && <p className="text-sm text-red-700">{delayError}</p>}
        {delaySaved && !delayError && <p className="text-sm text-green-700">Délai mis à jour.</p>}
      </section>
    </div>
  );
}

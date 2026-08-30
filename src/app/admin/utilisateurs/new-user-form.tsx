"use client";

import { useState, useTransition } from "react";
import { createUserAction } from "./actions";
import type { ManagedRole } from "@/lib/users";

const ROLE_LABEL: Record<ManagedRole, string> = {
  CLIENT: "Client",
  CUISINIER: "Cuisinier",
  LIVREUR: "Livreur",
};

export function NewUserForm() {
  const [role, setRole] = useState<ManagedRole>("LIVREUR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createUserAction({
        name,
        email,
        password,
        role,
        phone: phone || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setSuccess(true);
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-medium text-neutral-500">Créer un compte</h2>
      <div className="flex gap-2">
        {(["CUISINIER", "LIVREUR", "CLIENT"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
              role === r
                ? "border-red-800 bg-red-50 text-red-800"
                : "border-neutral-300 text-neutral-600"
            }`}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Téléphone (optionnel)"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe initial (à communiquer à l'intéressé)"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={pending}
        onClick={handleSubmit}
        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Création..." : "Créer le compte"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {success && !error && <p className="text-sm text-green-700">Compte créé.</p>}
    </section>
  );
}

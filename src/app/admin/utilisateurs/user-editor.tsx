"use client";

import { useState, useTransition } from "react";
import { updateUserAction, setUserDisabledAction, deleteUserAction } from "./actions";
import type { ManagedRole } from "@/lib/users";

const ROLE_LABEL: Record<ManagedRole, string> = {
  CLIENT: "Client",
  CUISINIER: "Cuisinier",
  LIVREUR: "Livreur",
};

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: ManagedRole;
  disabled: boolean;
};

export function UserEditor({
  user,
  activeDeliveries,
}: {
  user: UserData;
  activeDeliveries?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<ManagedRole>(user.role);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateUserAction(user.id, {
        name,
        email,
        phone,
        role,
        password: password || undefined,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setPassword("");
      setEditing(false);
    });
  }

  function handleToggleDisabled() {
    setError(null);
    startTransition(async () => {
      const result = await setUserDisabledAction(user.id, !user.disabled);
      if ("error" in result) setError(result.error);
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if ("error" in result) setError(result.error);
    });
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
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
            placeholder="Téléphone"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(["CUISINIER", "LIVREUR", "CLIENT"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={handleSave}
            className="rounded-lg bg-red-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-700"
          >
            Annuler
          </button>
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3">
      <div>
        <p className="font-medium">
          {user.name}{" "}
          <span
            className={`text-xs font-medium ${user.disabled ? "text-neutral-400" : "text-green-700"}`}
          >
            ({user.disabled ? "désactivé" : "actif"})
          </span>
        </p>
        <p className="text-sm text-neutral-500">
          {user.email}
          {user.phone ? ` — ${user.phone}` : ""}
        </p>
        {activeDeliveries !== undefined && (
          <p className="text-xs text-neutral-400">
            {activeDeliveries} livraison{activeDeliveries > 1 ? "s" : ""} en cours
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleToggleDisabled}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:opacity-60"
        >
          {user.disabled ? "Réactiver" : "Désactiver"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
        >
          Modifier
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleDelete}
          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}

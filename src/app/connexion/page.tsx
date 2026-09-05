"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction, registerAction } from "./actions";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base outline-none focus:border-red-700 focus:ring-1 focus:ring-red-700";
const labelClass = "mb-1 block text-sm font-medium";
const submitClass =
  "w-full rounded-lg bg-red-800 py-2.5 font-medium text-white transition hover:bg-red-900 disabled:opacity-60";

function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  useEffect(() => {
    if (state?.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nom
        </label>
        <input id="name" name="name" type="text" required autoComplete="name" className={inputClass} />
      </div>
      <div>
        <label htmlFor="register-email" className={labelClass}>
          Email
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>
          Téléphone <span className="font-normal text-neutral-500">(optionnel)</span>
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} />
      </div>
      <div>
        <label htmlFor="register-password" className={labelClass}>
          Mot de passe
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Création..." : "Créer mon compte"}
      </button>
    </form>
  );
}

export default function ConnexionPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-red-800">
          Pizza Fratelli
        </h1>
        <p className="mb-8 text-center text-sm text-neutral-500">
          {mode === "login" ? "Connexion à votre espace" : "Créer votre compte client"}
        </p>

        {mode === "login" ? <LoginForm /> : <RegisterForm />}

        <p className="mt-6 text-center text-sm text-neutral-500">
          {mode === "login" ? (
            <>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-medium text-red-800 hover:underline"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-medium text-red-800 hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

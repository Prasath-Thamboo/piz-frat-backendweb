"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart-context";
import { createOrder, addAddress } from "./actions";

type AddressOption = {
  id: string;
  label: string;
  line1: string;
  postalCode: string;
  city: string;
};

export function CartView({
  addresses,
  orderingOpen,
  deliveryPostalCodes,
}: {
  addresses: AddressOption[];
  orderingOpen: boolean;
  deliveryPostalCodes: string[];
}) {
  const router = useRouter();
  const { items, subtotalCents, setQuantity, removeItem, clear } = useCart();

  const [mode, setMode] = useState<"LIVRAISON" | "EMPORTER">(
    addresses.length > 0 ? "LIVRAISON" : "EMPORTER",
  );
  const [addressId, setAddressId] = useState<string | undefined>(
    addresses.find((a) => a) ? addresses[0]?.id : undefined,
  );
  const [showAddressForm, setShowAddressForm] = useState(addresses.length === 0);
  const [localAddresses, setLocalAddresses] = useState(addresses);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedAddress = localAddresses.find((a) => a.id === addressId);
  const outOfZone =
    mode === "LIVRAISON" &&
    selectedAddress &&
    deliveryPostalCodes.length > 0 &&
    !deliveryPostalCodes.includes(selectedAddress.postalCode);

  async function handleAddAddress(formData: FormData) {
    const result = await addAddress(formData);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setLocalAddresses((prev) => [...prev, result.address]);
    setAddressId(result.address.id);
    setShowAddressForm(false);
  }

  function handleSubmit() {
    setError(null);
    if (mode === "LIVRAISON" && !addressId) {
      setError("Choisissez une adresse de livraison.");
      return;
    }
    startTransition(async () => {
      const result = await createOrder({
        mode,
        addressId: mode === "LIVRAISON" ? addressId : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          supplementIds: item.supplements.map((s) => s.id),
        })),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      clear();
      router.push(`/commandes/${result.orderId}`);
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Pizza Fratelli
          </p>
          <h1 className="text-lg font-semibold">Mon panier</h1>
        </div>
        <Link href="/" className="text-sm text-neutral-500 underline">
          Retour à la carte
        </Link>
      </header>

      <main className="flex-1 space-y-6 p-4 pb-32">
        {!orderingOpen && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            La prise de commande est fermée pour le moment. Vous pouvez
            préparer votre panier, mais la validation ne sera pas possible.
          </p>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">Votre panier est vide.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.supplements.length > 0 && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        + {item.supplements.map((s) => s.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="whitespace-nowrap font-semibold text-red-800">
                    {(
                      ((item.unitPriceCents +
                        item.supplements.reduce((s, x) => s + x.priceCents, 0)) *
                        item.quantity) /
                      100
                    ).toFixed(2)}{" "}
                    €
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      className="h-7 w-7 rounded-full border border-neutral-300 text-sm"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      className="h-7 w-7 rounded-full border border-neutral-300 text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="text-xs text-neutral-400 underline"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-neutral-500">
                Mode de retrait
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("LIVRAISON")}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                    mode === "LIVRAISON"
                      ? "border-red-800 bg-red-50 text-red-800"
                      : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  Livraison
                </button>
                <button
                  type="button"
                  onClick={() => setMode("EMPORTER")}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                    mode === "EMPORTER"
                      ? "border-red-800 bg-red-50 text-red-800"
                      : "border-neutral-300 text-neutral-600"
                  }`}
                >
                  À emporter
                </button>
              </div>
            </section>

            {mode === "LIVRAISON" && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-neutral-500">
                  Adresse de livraison
                </h2>
                {localAddresses.length > 0 && !showAddressForm && (
                  <div className="space-y-2">
                    {localAddresses.map((address) => (
                      <label
                        key={address.id}
                        className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm"
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={addressId === address.id}
                          onChange={() => setAddressId(address.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium">{address.label}</span>
                          <span className="block text-neutral-500">
                            {address.line1}, {address.postalCode} {address.city}
                          </span>
                        </span>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="text-xs text-red-800 underline"
                    >
                      + Ajouter une nouvelle adresse
                    </button>
                  </div>
                )}

                {showAddressForm && (
                  <form
                    action={handleAddAddress}
                    className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3"
                  >
                    <input
                      name="label"
                      placeholder="Nom (ex. Domicile)"
                      required
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <input
                      name="line1"
                      placeholder="Adresse"
                      required
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        name="postalCode"
                        placeholder="Code postal"
                        required
                        className="w-1/3 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="city"
                        placeholder="Ville"
                        required
                        className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 rounded-lg bg-red-800 py-2 text-sm font-medium text-white"
                      >
                        Enregistrer l&apos;adresse
                      </button>
                      {localAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-lg border border-neutral-300 px-3 text-sm text-neutral-600"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {outOfZone && (
                  <p className="text-sm text-red-700">
                    Cette adresse semble en dehors de notre zone de livraison.
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500">Total</p>
              <p className="text-lg font-semibold text-red-800">
                {(subtotalCents / 100).toFixed(2)} €
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending || !orderingOpen}
              className="rounded-lg bg-red-800 px-6 py-2.5 font-medium text-white disabled:opacity-60"
            >
              {pending ? "Validation..." : "Valider la commande"}
            </button>
          </div>
          {error && (
            <p className="mx-auto mt-2 max-w-md text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

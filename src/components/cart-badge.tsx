"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-context";

export function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/panier"
      className="relative rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700"
    >
      Panier
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-800 px-1 text-xs font-semibold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

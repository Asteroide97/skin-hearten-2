"use client";

import { useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { useCartStore } from "@/store/cart-store";

type AddToCartButtonProps = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  className?: string;
  label?: string;
  addedLabel?: string;
  disabled?: boolean;
  soldOutLabel?: string;
};

export function AddToCartButton({
  productId,
  slug,
  name,
  price,
  className,
  label = "Agregar al carrito",
  addedLabel = "Anadido al carrito",
  disabled = false,
  soldOutLabel = "Agotado",
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  return (
    <button
      className={className ?? "btn-primary"}
      disabled={disabled}
      onClick={() => {
        if (disabled) {
          return;
        }

        addItem({ productId, slug, name, price });
        trackEvent("product_added_to_cart", {
          product_id: productId,
          product_name: name,
          quantity: 1,
          price,
        });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
      type="button"
    >
      {disabled ? soldOutLabel : added ? addedLabel : label}
    </button>
  );
}

import { SectionHeading } from "@/components/shared/section-heading";
import { CartPage } from "@/components/cart/cart-page";

export default function ShoppingCartPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Tu rutina"
        title="Lo que estas por llevar a tu piel"
        description="Revisa pasos, ajusta tu seleccion y continua con calma."
      />
      <CartPage />
    </div>
  );
}

import { SectionHeading } from "@/components/shared/section-heading";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Tu rutina casi esta lista"
        title="Un ultimo paso y la piel ya tiene plan"
        description="Datos de envio, pago protegido y una confirmacion mas tranquila."
      />
      <CheckoutForm />
    </div>
  );
}

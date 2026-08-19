"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { trackEvent } from "@/lib/analytics";
import type { SkinQuizOpenSource } from "@/lib/skin-quiz";
import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";

type HeroQuizButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  destination?: string;
  source: SkinQuizOpenSource;
};

export function HeroQuizButton({
  children,
  destination = "skin_quiz",
  onClick,
  source,
  ...props
}: HeroQuizButtonProps) {
  const label = typeof children === "string" ? children : "CTA";

  return (
    <SkinQuizTrigger
      {...props}
      onClick={(event) => {
        trackEvent("hero_cta_clicked", {
          destination,
          label,
          location: "hero",
        });
        onClick?.(event);
      }}
      source={source}
    >
      {children}
    </SkinQuizTrigger>
  );
}

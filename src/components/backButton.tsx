"use client";

import { useBackButton } from "@tma.js/sdk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BackButton({
  href
}: {
  href: string;
}) {
  const backButton = useBackButton();

  const router = useRouter();
  useEffect(() => {
    if (href === "") {
      backButton.hide();
      return;
    }
    backButton.on("click", () => {
      router.push(href);
    })
    backButton.show();
  }, [backButton])

  return null;
}

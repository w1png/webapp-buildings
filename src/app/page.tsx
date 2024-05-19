"use client";

import Link from "next/link";
import BackButton from "~/components/backButton";
import { Button } from "~/components/ui/button";

function HomeButton({
  href,
  text
}: {
  href: string;
  text: string;
}) {
  return (
    <Link href={href}>
      <Button>
        {text}
      </Button>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="h-screen p-4 flex items-center justify-center flex-col gap-4">
      <BackButton href="" />
      <HomeButton
        href="/users"
        text="Пользователи"
      />

      <HomeButton
        href="/regions"
        text="Округи"
      />
    </div>
  );
}

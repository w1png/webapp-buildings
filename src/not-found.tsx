import Link from "next/link";
import { Button } from "./components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex-col gap-4h-screen w-screen flex items-center justify-center">
      <p className="text-4xl font-bold">
        Страница не найдена
      </p>
      <Link href="/">
        <Button>
          На главную
        </Button>
      </Link>
    </div>
  );
}

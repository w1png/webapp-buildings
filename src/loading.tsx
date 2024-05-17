import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <span className="animate-spin">
        <Loader />
      </span>
    </div>
  );
}

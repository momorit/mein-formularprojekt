import { AlertTriangle } from "lucide-react";

export default function GlobalNotice() {
  return (
    <div
      className="w-full bg-gray-100 text-gray-800 text-sm py-2 px-4 flex items-center justify-center gap-2"
      role="status"
      aria-live="polite"
    >
      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      <p>
        Hinweis: Dieses Dialog-Interface befindet sich noch in der Entwicklung. Es können Fehler oder unnatürliche
        Antworten auftreten.
      </p>
    </div>
  );
}

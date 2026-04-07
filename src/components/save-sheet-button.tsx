"use client";

import { useState } from "react";

type SaveSheetButtonProps = {
  title: string;
  onPrint?: () => void;
};

export function SaveSheetButton({ title: _title, onPrint }: SaveSheetButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  function handleSave() {
    setIsSaving(true);
    if (onPrint) {
      onPrint();
      window.setTimeout(() => setIsSaving(false), 700);
      return;
    }

    window.print();
    window.setTimeout(() => setIsSaving(false), 250);
  }

  return (
    <button
      type="button"
      className="btn btn-soft print-hidden"
      onClick={handleSave}
      disabled={isSaving}
    >
      {isSaving ? "Telechargement..." : "IMPRIMER LA FICHE"}
    </button>
  );
}

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RowActions({ onEdit, onDelete }: Props) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <Button variant="ghost" size="icon-sm" aria-label="Ubah" onClick={onEdit}>
          <Pencil />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="icon-sm" aria-label="Hapus" onClick={onDelete}>
          <Trash2 className="text-destructive" />
        </Button>
      )}
    </div>
  );
}

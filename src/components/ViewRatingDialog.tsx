import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { RatingDisplay } from "./RatingDisplay";
import type { Rating } from "@/services/types/rating.types";
import { useDeleteRating } from "@/services";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useState } from "react";

interface ViewRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rating: Rating;
  onEdit?: () => void;
}

export function ViewRatingDialog({ 
  open, 
  onOpenChange, 
  rating,
  onEdit 
}: ViewRatingDialogProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const deleteRating = useDeleteRating();

  const handleDelete = async () => {
    try {
      await deleteRating.mutateAsync(rating.id);
      toast.success("Avaliação excluída com sucesso!");
      setShowDeleteAlert(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir avaliação. Tente novamente.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sua Avaliação</DialogTitle>
            <DialogDescription>
              Avaliação da chamada #{rating.callId}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <RatingDisplay rating={rating} />
          </div>

          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAlert(true)}
              disabled={deleteRating.isPending}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
            
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit();
                  }}
                >
                  Editar
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useCreateRating, useUpdateRating } from "@/services";
import { toast } from "sonner";
import type { Rating } from "@/services/types/rating.types";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callId: number;
  userId: number;
  existingRating?: Rating;
}

export function RatingDialog({ 
  open, 
  onOpenChange, 
  callId, 
  userId,
  existingRating 
}: RatingDialogProps) {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingRating?.comment || "");

  const createRating = useCreateRating();
  const updateRating = useUpdateRating();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação de 1 a 5 estrelas");
      return;
    }

    try {
      if (existingRating) {
        // Atualizar avaliação existente
        await updateRating.mutateAsync({
          id: existingRating.id,
          data: {
            rating,
            comment: comment.trim() || undefined,
          },
        });
        toast.success("Avaliação atualizada com sucesso!");
      } else {
        // Criar nova avaliação
        await createRating.mutateAsync({
          callId,
          raterId: userId,
          rating,
          comment: comment.trim() || undefined,
        });
        toast.success("Avaliação enviada com sucesso!");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao avaliar:", error);
      toast.error("Erro ao enviar avaliação. Tente novamente.");
    }
  };

  const displayRating = hoveredRating || rating;
  const isPending = createRating.isPending || updateRating.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingRating ? "Editar Avaliação" : "Avaliar Chamada"}
          </DialogTitle>
          <DialogDescription>
            {existingRating 
              ? "Atualize sua avaliação desta chamada" 
              : "Como foi sua experiência nesta chamada?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Label */}
            <p className="text-sm font-medium text-muted-foreground">
              {displayRating === 0 && "Selecione uma avaliação"}
              {displayRating === 1 && "Muito ruim"}
              {displayRating === 2 && "Ruim"}
              {displayRating === 3 && "Regular"}
              {displayRating === 4 && "Bom"}
              {displayRating === 5 && "Excelente"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              id="comment"
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || rating === 0}
          >
            {isPending 
              ? "Enviando..." 
              : existingRating 
                ? "Atualizar Avaliação" 
                : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

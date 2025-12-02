import { Star } from "lucide-react";
import type { Rating } from "@/services/types/rating.types";

interface RatingDisplayProps {
  rating: Rating;
  compact?: boolean;
}

export function RatingDisplay({ rating, compact = false }: RatingDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating.rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.rating})
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= rating.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">
          {rating.rating} de 5
        </span>
      </div>

      {rating.comment && (
        <p className="text-sm text-muted-foreground italic">
          "{rating.comment}"
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Avaliado em {new Date(rating.createdAt).toLocaleDateString("pt-BR")}
      </p>
    </div>
  );
}

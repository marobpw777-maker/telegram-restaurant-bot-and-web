import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Dish } from '@/types';
import { formatPrice } from '@/data/mockData';
import { Link } from 'react-router-dom';

interface DishCardProps {
  dish: Dish;
}

export function DishCard({ dish }: DishCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="group cursor-pointer">
        {/* Minimalist Image Container */}
        <div className="relative aspect-[4/5] bg-muted overflow-hidden mb-6">
          {!imageLoaded && (
            <div className="absolute inset-0 skeleton" />
          )}
          {dish.image ? (
            <img
              src={dish.image}
              alt={dish.name}
              className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              style={{ transitionDuration: '2000ms', transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/20">
               <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">Image — {dish.name}</span>
            </div>
          )}
          
          {/* Subtle Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700" />
          
          {/* Interaction Trigger */}
          <DialogTrigger asChild>
             <div className="absolute inset-0 z-10" />
          </DialogTrigger>
        </div>

        {/* Minimalist Typography */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline gap-4">
             <h3 className="text-xl md:text-2xl font-serif tracking-tight leading-tight group-hover:text-primary transition-colors duration-500">
                {dish.name}
             </h3>
             <span className="text-sm font-bold tracking-tighter">
                {formatPrice(dish.price)} ₽
             </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 max-w-[90%]">
             {dish.description}
          </p>
          <div className="flex items-center gap-4 pt-2">
             <span className="text-[10px] uppercase tracking-widest font-bold opacity-40">{dish.weight}</span>
             {dish.isHit && (
               <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Hit</span>
             )}
          </div>
        </div>
      </div>

      <DialogContent className="max-w-2xl bg-background border-none p-0 overflow-hidden rounded-none">
        <div className="grid grid-cols-1 md:grid-cols-2">
           <div className="aspect-[4/5] md:aspect-auto">
              <img src={dish.image} className="w-full h-full object-cover" />
           </div>
           <div className="p-12 flex flex-col">
              <DialogHeader className="mb-8">
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary mb-4 block">signature dish</span>
                <DialogTitle className="text-4xl font-serif font-bold tracking-tighter leading-none mb-4">{dish.name}</DialogTitle>
                <div className="h-[1px] w-12 bg-primary" />
              </DialogHeader>

              <div className="space-y-6 flex-1">
                 <p className="text-sm leading-relaxed text-muted-foreground">{dish.description}</p>
                 
                 {dish.ingredients && (
                    <div className="space-y-2">
                       <span className="text-[10px] uppercase tracking-widest font-bold block">Composition</span>
                       <p className="text-xs text-muted-foreground">{dish.ingredients.join(' — ')}</p>
                    </div>
                 )}
              </div>

              <div className="mt-12 space-y-6">
                 <div className="flex items-baseline justify-between border-t border-border pt-6">
                    <span className="text-[10px] uppercase tracking-widest font-bold">Valuation</span>
                    <span className="text-2xl font-bold tracking-tighter">{formatPrice(dish.price)} ₽</span>
                 </div>
                 <Button asChild className="btn-editorial w-full">
                    <Link to="/book" onClick={() => setIsOpen(false)}>Reserve for this dish</Link>
                 </Button>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

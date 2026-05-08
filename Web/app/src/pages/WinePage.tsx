import { useState, useMemo } from 'react';
import { Wine as WineIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenuItems, useCategories } from '@/hooks/useMenu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

export function WinePage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedWine, setSelectedWine] = useState<unknown>(null);

  const { data: categories } = useCategories();
  const { data: menuItems, isLoading } = useMenuItems();

  const wineCategories = useMemo(() => {
    return categories?.filter(c => c.type === 'wine') || [];
  }, [categories]);

  const wines = useMemo(() => {
    if (!menuItems) return [];
    const wineCatIds = wineCategories.map(c => String(c.id));
    return menuItems.filter(item => wineCatIds.includes(String(item.category?.id || item.category_id)));
  }, [menuItems, wineCategories]);

  const filteredWines = useMemo(() => {
    if (activeCategory === 'all') return wines;
    return wines.filter(item => String(item.category?.id || item.category_id) === activeCategory);
  }, [wines, activeCategory]);

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden bg-foreground">
        <div className="absolute inset-0 z-0">
           <img 
            src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover opacity-40"
            alt="Wine Cellar"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-foreground via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
           <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
           >
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary mb-8 block">the cellar collection</span>
              <h1 className="text-white mb-8">ВИНОТЕКА</h1>
              <p className="text-xl md:text-2xl text-white/70 font-serif italic max-w-2xl mx-auto">
                Редкие находки и великая классика, отобранные вручную для вашего идеального вечера.
              </p>
           </motion.div>
        </div>
      </section>

      {/* Navigation */}
      <section className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-8 justify-center">
            <button
              onClick={() => setActiveCategory('all')}
              className={`category-btn ${activeCategory === 'all' ? 'active' : 'text-muted-foreground'}`}
            >
              Вся коллекция
            </button>
            {wineCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(String(category.id))}
                className={`category-btn ${activeCategory === String(category.id) ? 'active' : 'text-muted-foreground'}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-none" />
            ))
          ) : (
            filteredWines.map((wine) => (
              <motion.div 
                key={wine.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
                onClick={() => setSelectedWine(wine)}
              >
                <div className="aspect-[3/4] bg-secondary/30 overflow-hidden mb-8 relative">
                   <div className="absolute inset-0 flex items-center justify-center p-12">
                      <WineIcon className="w-16 h-16 text-primary/20 group-hover:scale-110 transition-transform duration-700" />
                   </div>
                   {/* In a real app, here would be wine bottle images */}
                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-700" />
                </div>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-baseline gap-4">
                      <h3 className="text-xl md:text-2xl font-serif font-bold group-hover:text-primary transition-colors">{wine.name}</h3>
                      <span className="text-sm font-bold">{wine.price} ₽</span>
                   </div>
                   <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold opacity-40">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {wine.region || 'World'}</span>
                      <span>{wine.weight || '750ml'}</span>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Detail Modal */}
      <Dialog open={!!selectedWine} onOpenChange={(open) => !open && setSelectedWine(null)}>
        {selectedWine && (
          <DialogContent className="max-w-4xl p-0 border-none bg-background rounded-none overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
               <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
                  <WineIcon className="w-24 h-24 text-primary/20" />
               </div>
               <div className="p-12 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary mb-6 block">cellar details</span>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 leading-none">{selectedWine.name}</h2>
                  
                  <div className="space-y-8 mb-12">
                     <p className="text-sm text-muted-foreground leading-relaxed">{selectedWine.description}</p>
                     
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 block mb-2">Origin</span>
                           <span className="text-sm font-bold">{selectedWine.region}</span>
                        </div>
                        {selectedWine.grape_variety && (
                          <div>
                             <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 block mb-2">Variety</span>
                             <span className="text-sm font-bold">{selectedWine.grape_variety}</span>
                          </div>
                        )}
                     </div>

                     {selectedWine.food_pairing && (
                        <div className="pt-8 border-t border-border">
                           <span className="text-[10px] uppercase tracking-widest font-bold text-primary block mb-3">Chef's pairing</span>
                           <p className="text-sm italic">« {selectedWine.food_pairing} »</p>
                        </div>
                     )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-8">
                     <span className="text-2xl font-bold tracking-tighter">{selectedWine.price} ₽</span>
                     <Button className="btn-editorial" onClick={() => setSelectedWine(null)}>Back to list</Button>
                  </div>
               </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

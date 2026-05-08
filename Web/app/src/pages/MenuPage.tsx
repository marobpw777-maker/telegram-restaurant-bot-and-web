import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Star, Quote, Instagram, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DishCard } from '@/components/DishCard';
import { DishCardSkeleton, CategorySkeleton } from '@/components/DishCardSkeleton';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { restaurantInfo } from '@/data/mockData';

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);

  // Fetch data from API
  const { 
    data: categories, 
    isLoading: isLoadingCategories
  } = useCategories();
  
  const { 
    data: menuItems, 
    isLoading: isLoadingItems 
  } = useMenuItems(
    activeCategory !== 'all' ? activeCategory : undefined
  );

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    if (activeCategory === 'all') return menuItems;
    return menuItems.filter(item => String(item.category?.id) === String(activeCategory));
  }, [menuItems, activeCategory]);

  const isLoading = isLoadingCategories || isLoadingItems;

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-foreground">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          {/* Cinematic Background */}
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img 
            src="/hero.png" 
            alt="Interior" 
            className="w-full h-full object-cover opacity-0 transition-opacity duration-1000"
            onLoad={(e) => {
              (e.currentTarget as HTMLImageElement).classList.replace('opacity-0', 'opacity-100');
            }}
          />
        </motion.div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/60 mb-8 block">
              since 2012 — moscow
            </span>
            <h1 className="text-white mb-8 text-balance">
              ВКУС АТЛАНТИКИ
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-serif italic mb-12 max-w-2xl mx-auto">
              {restaurantInfo.description}
            </p>
            <div className="flex justify-center">
              <Button asChild className="btn-editorial">
                <Link to="/book">Забронировать стол</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 text-white/40"
        >
          <div className="w-[1px] h-12 bg-white/20 relative">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/60" />
          </div>
        </motion.div>
      </section>

      {/* Social Proof & Trust Section */}
      <section className="py-24 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center opacity-40">
            <div className="award-badge">
               <Award className="w-12 h-12 mb-4" />
               <span className="text-[10px] uppercase tracking-widest font-bold">Michelin Star 2024</span>
            </div>
            <div className="award-badge">
               <Star className="w-12 h-12 mb-4" />
               <span className="text-[10px] uppercase tracking-widest font-bold">World's 50 Best</span>
            </div>
            <div className="award-badge">
               <Quote className="w-12 h-12 mb-4" />
               <span className="text-[10px] uppercase tracking-widest font-bold">NY Times Choice</span>
            </div>
            <div className="award-badge">
               <Instagram className="w-12 h-12 mb-4" />
               <span className="text-[10px] uppercase tracking-widest font-bold">Chef's Table</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Menu Section */}
      <section id="menu" className="py-32 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
            <div className="max-w-2xl">
               <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary mb-6 block">seasonal card</span>
               <h2 className="text-balance">ГАСТРОНОМИЧЕСКАЯ ПАЛИТРА</h2>
            </div>
            <div className="flex-shrink-0">
               <p className="text-muted-foreground max-w-xs text-right hidden md:block">
                  Коллекция вкусов, вдохновленная природой и северными морями.
               </p>
            </div>
          </div>

          {/* Categories Navigation */}
          {isLoadingCategories ? (
            <CategorySkeleton />
          ) : (
            <div className="flex flex-wrap gap-8 mb-16 border-b border-border">
              <button
                onClick={() => setActiveCategory('all')}
                className={`category-btn ${activeCategory === 'all' ? 'active' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Все позиции
              </button>
              {categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(String(category.id))}
                  className={`category-btn ${activeCategory === String(category.id) ? 'active' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <DishCardSkeleton key={i} />)
              : filteredItems?.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <DishCard
                    dish={{
                      id: item.id,
                      name: item.name,
                      description: item.description || '',
                      price: item.price,
                      weight: item.weight || '',
                      image: item.image_url || undefined,
                      categoryId: item.category_id || '',
                      isSpicy: item.spice_level ? item.spice_level > 0 : false,
                      isHit: item.is_hit,
                      isNew: item.is_new,
                      allergens: item.allergens ? item.allergens.split(',').map((s: string) => s.trim()) : undefined,
                      ingredients: item.composition ? item.composition.split(',').map((s: string) => s.trim()) : undefined,
                      isAvailable: item.is_available,
                    }}
                  />
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Storytelling / Instagram Grid Concept */}
      <section className="py-32 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h3 className="mb-16">МОМЕНТЫ ВКУСА</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 aspect-square md:aspect-auto">
              <div className="aspect-square bg-muted overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="aspect-square bg-muted overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="aspect-square bg-muted overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="aspect-square bg-muted overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000" />
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}

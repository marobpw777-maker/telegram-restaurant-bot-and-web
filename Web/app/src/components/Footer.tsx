import { Link } from 'react-router-dom';
import { restaurantInfo } from '@/data/mockData';

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-24 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
          {/* Logo & Manifesto */}
          <div className="space-y-8">
            <span className="font-serif text-3xl font-bold tracking-tighter">
              {restaurantInfo.name.toUpperCase()}
            </span>
            <p className="text-sm text-background/60 leading-relaxed max-w-xs">
              Искусство гастрономии, рожденное в диалоге с природой. Каждый ингредиент — это слово, каждое блюдо — история.
            </p>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 block">Navigation</span>
              <ul className="space-y-4">
                <li><Link to="/menu" className="text-sm hover:opacity-50 transition-opacity">Меню</Link></li>
                <li><Link to="/book" className="text-sm hover:opacity-50 transition-opacity">Резерв</Link></li>
                <li><Link to="/info" className="text-sm hover:opacity-50 transition-opacity">История</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
               <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 block">Connect</span>
               <ul className="space-y-4">
                <li><a href="#" className="text-sm hover:opacity-50 transition-opacity">Instagram</a></li>
                <li><a href="#" className="text-sm hover:opacity-50 transition-opacity">Telegram</a></li>
                <li><a href="#" className="text-sm hover:opacity-50 transition-opacity">Почта</a></li>
              </ul>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-8">
             <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 block">Location</span>
                <p className="text-sm">{restaurantInfo.address}</p>
             </div>
             <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 block">Inquiries</span>
                <p className="text-sm">{restaurantInfo.phone}</p>
             </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/10">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">
            © 2026 {restaurantInfo.name.toUpperCase()}. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100">Политика</a>
            <a href="#" className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100">Условия</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

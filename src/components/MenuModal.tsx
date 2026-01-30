'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Utensils, Search, Coffee, Moon, Sun, Sunrise, Sparkles, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  calories?: string;
  dietary?: string;
  description?: string;
}

interface Station {
  name: string;
  items: MenuItem[];
}

interface Meal {
  name: string;
  stations: Station[];
}

// Helpers to parse the specific markdown format
function parseMenuMarkdown(markdown: string): Meal[] {
  const lines = markdown.split('\n');
  const meals: Meal[] = [];
  let currentMeal: Meal | null = null;
  let currentStation: Station | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Meal Header (## BREAKFAST)
    if (trimmed.startsWith('## ')) {
      if (currentStation && currentMeal) {
        currentMeal.stations.push(currentStation);
        currentStation = null;
      }
      if (currentMeal) {
        meals.push(currentMeal);
      }
      const mealName = trimmed.replace('## ', '').trim();
      currentMeal = { name: mealName, stations: [] };
    }
    // Station Header (### GRILL)
    else if (trimmed.startsWith('### ')) {
      if (currentStation && currentMeal) {
        currentMeal.stations.push(currentStation);
      }
      const stationName = trimmed.replace('### ', '').trim();
      currentStation = { name: stationName, items: [] };
    }
    // Item (- **Name** (cal) _[Dietary]_)
    else if (trimmed.startsWith('- ')) {
       if (!currentStation) continue;
       
       const nameMatch = trimmed.match(/\*\*(.*?)\*\*/);
       const name = nameMatch ? nameMatch[1] : trimmed.replace('- ', '');
       
       const calMatch = trimmed.match(/\((.*?cal)\)/);
       const calories = calMatch ? calMatch[1] : undefined;
       
       const dietMatch = trimmed.match(/_\[(.*?)\]_/);
       const dietary = dietMatch ? dietMatch[1] : undefined;

       currentStation.items.push({
         name,
         calories,
         dietary
       });
    }
    // Description (> Description)
    else if (trimmed.startsWith('> ')) {
       if (currentStation && currentStation.items.length > 0) {
         const lastItem = currentStation.items[currentStation.items.length - 1];
         lastItem.description = trimmed.replace('> ', '').trim();
       }
    }
  }

  // Push remaining context
  if (currentStation && currentMeal) {
    currentMeal.stations.push(currentStation);
  }
  if (currentMeal) {
    meals.push(currentMeal);
  }

  return meals;
}

function getMealIcon(mealName: string) {
  const name = mealName.toLowerCase();
  if (name.includes('breakfast')) return <Sunrise className="w-4 h-4" />;
  if (name.includes('lunch')) return <Sun className="w-4 h-4" />;
  if (name.includes('dinner')) return <Moon className="w-4 h-4" />;
  if (name.includes('late')) return <Coffee className="w-4 h-4" />;
  return <Utensils className="w-4 h-4" />;
}

// Helpers to slugify match the script
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Sub-component for Food Preview
function FoodPreviewModal({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const imageUrl = `/images/menu/${slugify(item.name)}.jpg`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
       <div className="absolute inset-0" onClick={onClose} />
       
       <div className="relative w-full max-w-lg bg-background rounded-2xl border border-border/50  shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/50 text-white hover:bg-black/70 rounded-full z-10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image Area */}
          <div className="relative aspect-square w-full bg-muted/20 flex items-center justify-center">
             <img 
               src={imageUrl} 
               alt={item.name} 
               className="w-full h-full object-cover animate-in fade-in duration-500"
               onError={(e) => {
                 // Fallback if file missing (though script generated them)
                 e.currentTarget.src = '/images/menu/placeholder.jpg';
               }}
             />
          </div>

          {/* Details */}
          <div className="p-6">
             <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
             {item.description && (
                <p className="text-muted-foreground mb-4">{item.description}</p>
             )}
             
             <div className="flex flex-wrap gap-2 text-xs font-medium">
                {item.calories && (
                  <span className="px-2 py-1 bg-muted rounded-md text-foreground">
                    {item.calories}
                  </span>
                )}
                {item.dietary && item.dietary.replace(/[\[\]_]/g, '').split(',').map((tag, i) => (
                   <span key={i} className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-400 rounded-md">
                     {tag.trim()}
                   </span>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}

export function MenuModal({ isOpen, onClose }: MenuModalProps) {
  const [data, setData] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Fetch and parse data
  useEffect(() => {
    if (isOpen && data.length === 0) {
      setLoading(true);
      fetch('/api/menu')
        .then(res => res.json())
        .then(resData => {
            if(resData.content) {
                const parsed = parseMenuMarkdown(resData.content);
                setData(parsed);
                const lunch = parsed.find(m => m.name.toUpperCase().includes('LUNCH'));
                setActiveTab(lunch ? lunch.name : (parsed[0]?.name || ''));
            }
            setLoading(false);
        })
        .catch(err => {
            console.error(err); 
            setLoading(false);
        });
    }
  }, [isOpen, data.length]);

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Filter logic
  const filteredStations = useMemo(() => {
    const currentMeal = data.find(m => m.name === activeTab);
    if (!currentMeal) return [];

    if (!searchQuery.trim()) return currentMeal.stations;

    const lowerQuery = searchQuery.toLowerCase();
    
    return currentMeal.stations.map(station => {
      if (station.name.toLowerCase().includes(lowerQuery)) return station;

      const matchingItems = station.items.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) || 
        (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
        (item.dietary && item.dietary.toLowerCase().includes(lowerQuery))
      );

      if (matchingItems.length > 0) {
        return { ...station, items: matchingItems };
      }
      return null;
    }).filter(Boolean) as Station[];

  }, [data, activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={onClose} />

          <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-background rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden font-sans">
              
              {/* Header Area */}
              <div className="flex flex-col border-b border-border bg-background z-10">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-xl">
                              <Utensils className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                              <h2 className="text-xl font-bold leading-none mb-1">Campus Dining</h2>
                              <p className="text-xs text-muted-foreground font-medium">Birch Tree Inn • Daily Menu</p>
                          </div>
                      </div>
                      <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-muted rounded-full transition-colors opacity-70 hover:opacity-100"
                      >
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Tabs & Search Row */}
                  <div className="px-6 pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Modern Tabs */}
                      <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto pb-3 sm:pb-0">
                          {data.map(meal => (
                              <button
                                  key={meal.name}
                                  onClick={() => setActiveTab(meal.name)}
                                  className={`
                                      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap
                                      ${activeTab === meal.name 
                                          ? 'bg-primary text-primary-foreground shadow-md' 
                                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                      }
                                  `}
                              >
                                  {getMealIcon(meal.name)}
                                  {meal.name}
                              </button>
                          ))}
                      </div>

                      {/* Search Bar */}
                      <div className="relative w-full sm:w-64 mb-3 sm:mb-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                              type="text"
                              placeholder="Find food (e.g. 'chicken')..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 h-9 text-sm rounded-full border border-border bg-muted/30 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                      </div>
                  </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-6 scroll-smooth">
                  {loading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm font-medium">Loading fresh menu data...</p>
                      </div>
                  ) : filteredStations && filteredStations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredStations.map((station, idx) => (
                              <div key={idx} className="bg-background rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                                  {/* Station Header */}
                                  <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                                      <h3 className="font-bold text-sm uppercase tracking-wide text-primary">
                                          {station.name}
                                      </h3>
                                      <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                                          {station.items.length} items
                                      </span>
                                  </div>
                                  {/* Items List */}
                                  <div className="p-4 space-y-4 flex-1">
                                      {station.items.map((item, i) => (
                                          <div 
                                            key={i} 
                                            onClick={() => setSelectedItem(item)}
                                            className="flex flex-col gap-1 cursor-pointer group hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors relative"
                                          >
                                              <div className="flex items-start justify-between gap-2">
                                                  <span className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors">
                                                      {item.name}
                                                  </span>
                                                  {item.calories && (
                                                      <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap bg-muted px-1.5 rounded">
                                                          {item.calories}
                                                      </span>
                                                  )}
                                              </div>
                                              {item.description && (
                                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                      {item.description}
                                                  </p>
                                              )}
                                              <div className="flex items-center justify-between mt-1">
                                                  {item.dietary ? (
                                                      <div className="flex flex-wrap gap-1">
                                                          {item.dietary.replace(/[\[\]_]/g, '').split(',').map((tag, t) => (
                                                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-green-500/10 text-green-700 dark:text-green-400 font-medium">
                                                                {tag.trim()}
                                                            </span>
                                                          ))}
                                                      </div>
                                                  ) : <div></div>}
                                                  
                                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                      View
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                          <div className="bg-muted p-4 rounded-full mb-3">
                              <Utensils className="w-8 h-8" />
                          </div>
                          <p>No items found for "{searchQuery}" in {activeTab}</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
      
      {/* Food Preview Modal */}
      {selectedItem && (
        <FoodPreviewModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </>
  );
}

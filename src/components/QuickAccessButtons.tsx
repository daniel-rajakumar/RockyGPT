'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Bus, Clock, Phone, Shield, MapPin, ExternalLink, AlertTriangle, Calendar } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// EVENTS MODAL - Campus Events (Styled Cards)
// ============================================
interface EventItem {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  link?: string;
}

const eventData: EventItem[] = [
  {
    title: "RMCG Hosts AMEX VP/Former BCGer",
    date: "Thursday, Jan 29",
    time: "6:00 PM - 7:30 PM",
    location: "ASB 135 / Virtual",
    description: "Ramapo Management Consulting Group hosts Joe Verde, a VP at AMEX and former BCG Project Leader. Learn about management consulting recruiting and get practical feedback.",
    link: "https://archway.ramapo.edu/rsvp?id=1407562"
  },
  {
    title: "Indoor Soccer Pickup",
    date: "Friday, Jan 30",
    time: "1:00 AM",
    location: "Aux Gym - Bradley Center",
    description: "Join us in the Bradley Center Aux Gym for our weekly indoor soccer pickup games! Arrive 10-15 mins early to sort teams.",
    link: "https://archway.ramapo.edu/rsvp?id=1407596"
  },
  {
    title: "Ice Cream Social",
    date: "Friday, Jan 30",
    time: "9:00 PM",
    location: "Friends Hall",
    description: "Join the College Programming Board for free ice cream, fun vibes, and time with friends.",
    link: "https://archway.ramapo.edu/rsvp?id=1407821"
  },
  {
    title: "Winter Warm Up",
    date: "Saturday, Jan 31",
    time: "4:00 PM",
    location: "Bradley Center Lobby",
    description: "Center for Student Involvement presents Winter Warm Up.",
    link: "https://archway.ramapo.edu/rsvp?id=1407775"
  },
  {
    title: "Men's Basketball vs. TCNJ",
    date: "Saturday, Jan 31",
    time: "6:00 PM",
    location: "Bradley Center",
    description: "Come out and support your Roadrunners! All RCNJ Students with ID are FREE!",
    link: "https://archway.ramapo.edu/rsvp?id=1404683"
  },
  {
    title: "Commuter Breakfast",
    date: "Monday, Feb 2",
    time: "2:00 PM",
    location: "Student Center, 2nd Floor",
    description: "FREE breakfast for commuters! Food served on a first come, first served basis while supplies last.",
    link: "https://archway.ramapo.edu/rsvp?id=1407396"
  },
];

export function EventsModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-background rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none mb-1">Campus Events</h2>
              <p className="text-xs text-muted-foreground font-medium">Upcoming activities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {eventData.map((event, idx) => (
            <div key={idx} className="bg-muted/30 border border-border rounded-xl p-4 transition-colors hover:bg-muted/50">
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <h3 className="font-bold text-foreground leading-tight">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-primary">
                    <span className="bg-primary/10 px-2 py-0.5 rounded text-nowrap">{event.date}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{event.time}</span>
                  </div>
                </div>
                {event.link && (
                  <a 
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
              
              <div className="flex items-start gap-1.5 mb-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{event.location}</span>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed">
                {event.description}
              </p>
            </div>
          ))}
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
             <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
               View full calendar at ramapo.edu/events
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// BUS MODAL - Shuttle Schedules (Styled Cards)
// ============================================
type ShuttleStop = {
  time: string;
  location: string;
};

type ShuttleRoute = {
  departure: string;
  stops: ShuttleStop[];
  arrival: string;
};

const weekdayRoutes: ShuttleRoute[] = [
  { departure: "7:00 AM", stops: [{ time: "7:30 AM", location: "Garden State Plaza" }], arrival: "7:55 AM" },
  { departure: "8:25 AM", stops: [{ time: "8:35 AM", location: "Interstate Plaza" }, { time: "8:55 AM", location: "Garden State Plaza" }], arrival: "9:25 AM" },
  { departure: "10:15 AM", stops: [{ time: "10:25 AM", location: "Interstate Plaza" }, { time: "10:45 AM", location: "Garden State Plaza" }], arrival: "11:20 AM" },
  { departure: "4:40 PM", stops: [{ time: "4:50 PM", location: "Train Station" }, { time: "5:00 PM", location: "CityMD" }, { time: "5:25 PM", location: "Garden State Plaza" }], arrival: "6:10 PM" },
  { departure: "6:10 PM", stops: [{ time: "6:25 PM", location: "Interstate Plaza" }, { time: "6:50 PM", location: "Garden State Plaza" }], arrival: "7:35 PM" },
];

const pickupLocations = [
  { name: "Interstate Plaza", detail: "In front of Macy's" },
  { name: "Garden State Plaza", detail: "Bus shelters across from Neiman Marcus" },
  { name: "Ramsey Train Station", detail: "Rt 17 Train Station" },
  { name: "CityMD Ramsey", detail: "Outside main entrance" },
];

export function BusModal({ isOpen, onClose }: ModalProps) {
  const [activeTab, setActiveTab] = useState<'schedule' | 'locations' | 'express'>('schedule');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-background rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Bus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none mb-1">Shuttle Schedule</h2>
              <p className="text-xs text-muted-foreground font-medium">Ramapo Roadrunner Express</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/30">
          {[
            { id: 'schedule', label: 'Weekday' },
            { id: 'express', label: 'Express' },
            { id: 'locations', label: 'Pickup Spots' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'schedule' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center mb-4">
                Campus stop: <strong>Bradley Center</strong> only
              </p>
              {weekdayRoutes.map((route, idx) => (
                <div key={idx} className="bg-muted/30 border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚌</span>
                      <span className="font-bold text-primary">{route.departure}</span>
                      <span className="text-xs text-muted-foreground">depart</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Return: <span className="font-medium text-foreground">{route.arrival}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {route.stops.map((stop, i) => (
                      <span key={i} className="text-xs bg-background border border-border rounded-full px-2 py-1">
                        {stop.time} • {stop.location}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'express' && (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="font-bold text-primary mb-1">Mid-Day Express</p>
                <p className="text-sm text-muted-foreground">Bradley Center ↔ Ramsey Train Station</p>
              </div>
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Runs every 20-40 mins</p>
                <p className="text-xs text-muted-foreground">7:00 AM - 5:40 PM weekdays</p>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Example times: 7:00 AM, 7:25 AM, 7:50 AM, 8:20 AM, 9:05 AM, 10:40 AM, 12:45 PM, 2:35 PM, 4:10 PM
              </div>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="space-y-2">
              {pickupLocations.map((loc, idx) => (
                <div key={idx} className="bg-muted/30 border border-border rounded-xl p-3">
                  <p className="font-medium text-foreground">{loc.name}</p>
                  <p className="text-xs text-muted-foreground">{loc.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Follow <span className="text-primary font-medium">@RCNJShuttle</span> on Twitter for updates
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HOURS MODAL - Dining Hours (Styled Cards)
// ============================================
interface DiningLocation {
  name: string;
  emoji: string;
  weekend: string;
  meals?: { name: string; time: string }[];
  schedule?: { days: string; time: string }[];  // For varied schedules
  weekday?: string;  // Simple single schedule
}

const diningLocations: DiningLocation[] = [
  {
    name: "Birch Tree Inn",
    emoji: "🍽️",
    weekend: "Sat-Sun",
    meals: [
      { name: "Breakfast", time: "8:00 - 10:30 AM" },
      { name: "Continental", time: "10:30 - 11:00 AM" },
      { name: "Lunch", time: "11:00 AM - 2:00 PM" },
      { name: "Lite Lunch", time: "2:00 - 5:00 PM" },
      { name: "Dinner", time: "5:00 - 8:00 PM" },
      { name: "Late Night", time: "9:00 - 11:00 PM" },
    ],
  },
  {
    name: "Dunkin'",
    emoji: "☕",
    weekday: "7:30 AM - 3:00 PM",
    weekend: "Closed",
  },
  {
    name: "The Atrium",
    emoji: "🥗",
    weekday: "7:30 AM - 7:00 PM",
    weekend: "Closed",
  },
  {
    name: "Starbucks @ Common Grounds",
    emoji: "☕",
    schedule: [
      { days: "Mon - Thu", time: "10:00 AM - 8:00 PM" },
      { days: "Friday", time: "12:00 - 5:00 PM" },
    ],
    weekend: "Closed",
  },
];

export function HoursModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-background rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none mb-1">Dining Hours</h2>
              <p className="text-xs text-muted-foreground font-medium">Campus dining locations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {diningLocations.map((loc, idx) => (
            <div key={idx} className="bg-muted/30 border border-border rounded-xl p-4">
              {/* Location Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{loc.emoji}</span>
                <h3 className="font-bold text-foreground">{loc.name}</h3>
              </div>
              
              {/* If has meal periods (Birch Tree Inn) */}
              {loc.meals ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Weekday Hours (Mon-Fri)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {loc.meals.map((meal, i) => (
                      <div key={i} className="flex justify-between items-center bg-background rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium text-foreground">{meal.name}</span>
                        <span className="text-muted-foreground text-xs">{meal.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">Weekend (Sat-Sun)</span>
                      <span className="text-muted-foreground">Brunch 10:30 AM - 3:00 PM</span>
                    </div>
                  </div>
                </div>
              ) : loc.schedule ? (
                /* Multiple schedule rows (e.g., Starbucks with different Mon-Thu vs Fri hours) */
                <div className="space-y-2">
                  {loc.schedule.map((slot, i) => (
                    <div key={i} className="flex justify-between items-center bg-background rounded-lg px-3 py-2.5">
                      <span className="text-sm font-medium text-foreground">{slot.days}</span>
                      <span className="text-sm text-primary font-medium">{slot.time}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-background rounded-lg px-3 py-2.5">
                    <span className="text-sm font-medium text-foreground">Weekend</span>
                    <span className={`text-sm font-medium ${loc.weekend === 'Closed' ? 'text-red-500' : 'text-primary'}`}>
                      {loc.weekend}
                    </span>
                  </div>
                </div>
              ) : (
                /* Simple hours for other locations */
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-background rounded-lg px-3 py-2.5">
                    <span className="text-sm font-medium text-foreground">Mon - Fri</span>
                    <span className="text-sm text-primary font-medium">{loc.weekday}</span>
                  </div>
                  <div className="flex justify-between items-center bg-background rounded-lg px-3 py-2.5">
                    <span className="text-sm font-medium text-foreground">Weekend</span>
                    <span className={`text-sm font-medium ${loc.weekend === 'Closed' ? 'text-red-500' : 'text-primary'}`}>
                      {loc.weekend}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Hours may vary during holidays and breaks
          </p>
        </div>
      </div>
    </div>
  );
}


// ============================================
// DIRECTORY MODAL - Key Phone Numbers
// ============================================
const directoryData = [
  { name: 'Public Safety (Emergency)', phone: '201-684-6666', category: 'Emergency' },
  { name: 'Public Safety (Non-Emergency)', phone: '201-684-7432', category: 'Emergency' },
  { name: 'Birch Tree Inn', phone: '201-684-7592', category: 'Dining' },
  { name: 'Registrar', phone: '201-684-7695', category: 'Academic' },
  { name: 'Financial Aid', phone: '201-684-7549', category: 'Financial' },
  { name: 'IT Help Desk', phone: '201-684-7211', category: 'Services' },
  { name: 'Health Services', phone: '201-684-7536', category: 'Health' },
  { name: 'Counseling Center', phone: '201-684-7522', category: 'Health' },
  { name: 'Housing & Residence Life', phone: '201-684-7453', category: 'Housing' },
  { name: 'Center for Student Involvement', phone: '201-684-7593', category: 'Student Life' },
  { name: 'Athletics', phone: '201-684-7095', category: 'Athletics' },
  { name: 'Library', phone: '201-684-7578', category: 'Academic' },
];

export function DirectoryModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [...new Set(directoryData.map(d => d.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-background rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none mb-1">Directory</h2>
              <p className="text-xs text-muted-foreground font-medium">Important phone numbers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2 px-2">{cat}</h3>
              <div className="space-y-1">
                {directoryData.filter(d => d.category === cat).map((item, i) => (
                  <a
                    key={i}
                    href={`tel:${item.phone.replace(/-/g, '')}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm text-primary font-mono group-hover:underline">{item.phone}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SAFETY MODAL - Emergency Info
// ============================================
export function SafetyModal({ isOpen, onClose }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background rounded-2xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 rounded-xl">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none mb-1">Campus Safety</h2>
              <p className="text-xs text-muted-foreground font-medium">Emergency contacts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors opacity-70 hover:opacity-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Emergency Call */}
          <a
            href="tel:2016846666"
            className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <div className="p-3 bg-red-500 rounded-full">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">Emergency: 201-684-6666</p>
              <p className="text-sm text-muted-foreground">Public Safety 24/7</p>
            </div>
          </a>

          {/* Non-Emergency */}
          <a
            href="tel:2016847432"
            className="flex items-center gap-4 p-4 bg-muted/50 border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <div className="p-3 bg-primary/10 rounded-full">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">Non-Emergency: 201-684-7432</p>
              <p className="text-sm text-muted-foreground">General inquiries & escorts</p>
            </div>
          </a>

          {/* Quick Links */}
          <div className="pt-2 space-y-2">
            <h3 className="text-xs font-bold uppercase text-muted-foreground">Quick Links</h3>
            <a
              href="https://www.ramapo.edu/publicsafety/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
            >
              <span>Public Safety Website</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
            <a
              href="https://www.ramapo.edu/alert/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm"
            >
              <span>Emergency Alerts Sign-up</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>

          {/* SafeWalk */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">SafeWalk Program</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Request a safety escort anywhere on campus. Call Public Safety at 201-684-7432.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HEADER BUTTONS COMPONENT
// ============================================
interface QuickAccessButtonsProps {
  onMapClick: () => void;
  onBusClick: () => void;
  onHoursClick: () => void;
  onDirectoryClick: () => void;
  onSafetyClick: () => void;
  onEventsClick: () => void;
  onMenuClick: () => void;
}

export function QuickAccessButtons({
  onMapClick,
  onBusClick,
  onHoursClick,
  onDirectoryClick,
  onSafetyClick,
  onEventsClick,
  onMenuClick,
}: QuickAccessButtonsProps) {
  const buttons = [
    { icon: MapPin, label: 'Map', onClick: onMapClick },
    { icon: Bus, label: 'Bus', onClick: onBusClick },
    { icon: Clock, label: 'Hours', onClick: onHoursClick },
    { icon: Calendar, label: 'Events', onClick: onEventsClick },
    { icon: Phone, label: 'Directory', onClick: onDirectoryClick },
    { icon: Shield, label: 'Safety', onClick: onSafetyClick },
  ];

  return (
    <div className="flex items-center gap-1">
      {buttons.map(({ icon: Icon, label, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

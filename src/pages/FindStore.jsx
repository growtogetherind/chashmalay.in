import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Clock, Search, Navigation } from 'lucide-react';
import { FadeIn, RevealText, StaggerContainer, StaggerItem } from '../components/ui/Motion';

const STORES = [
    {
        id: 1,
        city: 'Lonavala',
        name: 'Chashmaly - Ch. Shivaji Maharaj Chouk',
        address: 'Opp. Nakoda Complex, Lonavala, Maharashtra - 410401',
        phone: '8956951884',
        hours: '10:30 AM - 8:30 PM',
        lat: 18.7557, lng: 73.4091
    },
    {
        id: 2,
        city: 'Somatane Phata',
        name: 'Chashmaly - Trumurti Plaza',
        address: 'Shop No. 7, Somatane Phata, Maharashtra - 410506',
        phone: '7620681884',
        hours: '10:30 AM - 8:30 PM',
        lat: 18.7042, lng: 73.7196
    },
    {
        id: 3,
        city: 'Rahatani',
        name: 'Chashmaly - Dattanagar',
        address: 'Opp. Amardeep Colony, Rahatani, Pune - 411017',
        phone: '9272151202',
        hours: '10:30 AM - 8:30 PM',
        lat: 18.5922, lng: 73.7847
    },
    {
        id: 4,
        city: 'Wakad',
        name: 'Chashmaly - Dattamandir Road',
        address: 'Shop No. 2, Near Vitalife Clinic, Wakad, Pune - 411057',
        phone: '93735 88873',
        hours: '10:30 AM - 9:00 PM',
        lat: 18.5996, lng: 73.7682
    },
    {
        id: 5,
        city: 'Shirur',
        name: 'Chashmaly - Nirman Plaza',
        address: 'Shop No. 2, C T Bora College Road, Shirur, Maharashtra - 412210',
        phone: '9028275574',
        hours: '10:30 AM - 8:30 PM',
        lat: 18.8266, lng: 74.3756
    },
    {
        id: 6,
        city: 'Talegaon Dabhade',
        name: 'Chashmaly - P L Khandge Plaza',
        address: 'Shop No. 4, Near Saraswat Bank, Talegaon Dabhade, Maharashtra - 410506',
        phone: '7620681884',
        hours: '10:30 AM - 8:30 PM',
        lat: 18.7303, lng: 73.6766
    }
];

// Helper to calculate distance in KM
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const FindStore = () => {
    const [selectedCity, setSelectedCity] = useState('All');
    const [userLocation, setUserLocation] = useState(null);
    const [nearestStoreId, setNearestStoreId] = useState(null);

    const findNearest = () => {
        if (!navigator.geolocation) return;
        
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });

            let minDistance = Infinity;
            let nearestId = null;

            STORES.forEach(store => {
                const dist = getDistance(latitude, longitude, store.lat, store.lng);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestId = store.id;
                }
            });

            setNearestStoreId(nearestId);
            
            // Auto-scroll to nearest store card
            setTimeout(() => {
                const nearestElement = document.getElementById(`store-${nearestId}`);
                if (nearestElement) {
                    nearestElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        });
    };

    const filteredStores = STORES.filter(store => {
        const matchesCity = selectedCity === 'All' || store.city === selectedCity;
        return matchesCity;
    });

    const cities = ['All', ...new Set(STORES.map(s => s.city))];

    return (
        <div className="min-h-screen bg-background text-primary pt-32 pb-24">
            <div className="container">
                {/* Header */}
                <header className="max-w-3xl mx-auto text-center mb-20">
                    <span className="text-xs font-sans font-semibold uppercase tracking-[0.3em] text-accent-dark mb-4 block">
                        Boutique Locator
                    </span>
                    <h1 className="text-5xl md:text-7xl mb-8 leading-tight tracking-tighter">
                        <RevealText text="Find a" className="block" />
                        <RevealText text="Perspective." delay={0.2} className="text-secondary italic block font-light" />
                    </h1>
                    <FadeIn delay={0.4}>
                        <p className="text-secondary tracking-wide text-lg font-sans leading-relaxed">
                            Experience our craft in person. Visit our physical galleries for personalized styling and technical eye examinations.
                        </p>
                    </FadeIn>
                </header>

                {/* Filter Bar */}
                <FadeIn delay={0.6}>
                    <div className="max-w-4xl mx-auto mb-20 flex justify-center">
                        <div className="flex flex-wrap justify-center gap-4 w-full">
                            <button
                                onClick={findNearest}
                                className="px-8 py-4 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all bg-accent-dark text-white hover:bg-primary flex items-center gap-2 shadow-lg shadow-accent/20"
                            >
                                <Navigation size={14} /> Use My Location
                            </button>
                            {cities.map(city => (
                                <button
                                    key={city}
                                    onClick={() => setSelectedCity(city)}
                                    className={`px-8 py-4 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap shadow-sm border ${
                                        selectedCity === city 
                                        ? 'bg-primary text-white border-primary scale-105' 
                                        : 'bg-white border-divider text-secondary hover:border-primary'
                                    }`}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* Stores Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    {/* List */}
                    <div className="lg:col-span-5 space-y-10 max-h-[75vh] overflow-y-auto pr-6 custom-scrollbar">
                        <StaggerContainer>
                            {filteredStores.length > 0 ? (
                                filteredStores.map((store) => (
                                    <StaggerItem key={store.id}>
                                        <motion.div 
                                            id={`store-${store.id}`}
                                            whileHover={{ y: -4 }}
                                            className={`p-8 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                                                nearestStoreId === store.id ? 'border-accent-dark bg-accent/5 ring-1 ring-accent-dark/20' : 'border-divider bg-white hover:border-accent'
                                            }`}
                                        >
                                            {nearestStoreId === store.id && (
                                                <div className="absolute top-0 right-0 bg-accent-dark text-white text-[9px] font-bold px-4 py-1 rounded-bl-xl tracking-widest uppercase">
                                                    Nearest to You
                                                </div>
                                            )}
                                            <span className="text-[10px] font-bold tracking-[0.2em] text-accent-dark mb-4 block uppercase italic">
                                                {store.city}
                                            </span>
                                            <h3 className="text-2xl font-medium mb-6 tracking-tight leading-snug">
                                                {store.name}
                                            </h3>
                                            
                                            <div className="space-y-4 text-sm font-sans text-secondary leading-relaxed">
                                                <div className="flex gap-4">
                                                    <MapPin size={18} className="text-primary/50 shrink-0 mt-1" />
                                                    <p>{store.address}</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Phone size={18} className="text-primary/50 shrink-0 mt-1" />
                                                    <p>{store.phone}</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <Clock size={18} className="text-primary/50 shrink-0 mt-1" />
                                                    <p>{store.hours}</p>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-divider flex justify-between items-center">
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + store.address)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[10px] font-bold tracking-widest uppercase text-primary hover:text-accent-dark transition-colors flex items-center gap-2"
                                                >
                                                    Get Directions <Navigation size={12} />
                                                </a>
                                            </div>
                                        </motion.div>
                                    </StaggerItem>
                                ))
                            ) : (
                                <p className="text-center py-20 text-secondary font-sans">No stores found in this location.</p>
                            )}
                        </StaggerContainer>
                    </div>

                    {/* Map Section */}
                    <div className="lg:col-span-7 h-[70vh] rounded-[2.5rem] overflow-hidden bg-surface-flat relative border border-divider shadow-inner group">
                        <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(STORES.find(s => s.id === nearestStoreId)?.name || 'chashmaly.in boutique ' + selectedCity)}&output=embed`}
                            allowFullScreen
                            className="grayscale contrast-125 opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FindStore;

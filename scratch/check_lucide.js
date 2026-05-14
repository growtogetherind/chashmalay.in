import * as Lucide from 'lucide-react';
const allKeys = Object.keys(Lucide);
console.log('Search for "Twitter":', allKeys.filter(k => k.toLowerCase().includes('twitter')));
console.log('Search for "Insta":', allKeys.filter(k => k.toLowerCase().includes('insta')));
console.log('Search for "Face":', allKeys.filter(k => k.toLowerCase().includes('face')));
console.log('Search for "Tube":', allKeys.filter(k => k.toLowerCase().includes('tube')));

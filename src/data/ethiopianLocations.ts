import { EthiopianLocation } from '../types';

export const ETHIOPIAN_LOCATIONS: EthiopianLocation[] = [
  {
    city: 'Addis Ababa',
    subcities: [
      'Bole',
      'Yeka',
      'Kirkos',
      'Nifas Silk-Lafto',
      'Arada',
      'Lideta',
      'Kolfe Keranio',
      'Gulele',
      'Akaky Kaliti',
      'Addis Ketema'
    ],
    popularNeighborhoods: [
      'Bole Medhanialem',
      'Bole Atlas',
      'CMC / Sunshine',
      'Kazanchis',
      'Sarbet',
      'Gerji',
      'Summit',
      'Old Airport',
      'Meskel Flower',
      'Mexico',
      'Piassa',
      'Ayat',
      'Megenagna',
      'Gotera',
      'Lebu'
    ],
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    propertyCount: 342
  },
  {
    city: 'Hawassa',
    subcities: ['Tabor', 'Menehariya', 'Haik Dar', 'Bahil Adarash', 'Mehal Ketema'],
    popularNeighborhoods: ['Lakefront Area', 'Piassa Hawassa', 'St. George', 'Gudumale'],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    propertyCount: 54
  },
  {
    city: 'Bahir Dar',
    subcities: ['Gish Abay', 'Fasilo', 'Belay Zeleke', 'Dagmawi Menelik'],
    popularNeighborhoods: ['Tana View', 'Avanti Lakefront', 'Shimbit', 'Ginbot 20'],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    propertyCount: 42
  },
  {
    city: 'Bishoftu (Debre Zeyit)',
    subcities: ['Bishoftu Town', 'Kuriftu Area', 'Babby Lake', 'Hora'],
    popularNeighborhoods: ['Kuriftu Resort Zone', 'Lake Babogaya', 'Lake Bishoftu', 'Center'],
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    propertyCount: 38
  },
  {
    city: 'Adama (Nazret)',
    subcities: ['Boku Shenen', 'Dembela', 'Goro', 'Lugo'],
    popularNeighborhoods: ['Ras Hotel Area', 'Canal Area', 'Stadium Area', 'Posta'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    propertyCount: 29
  },
  {
    city: 'Dire Dawa',
    subcities: ['Sabian', 'Gende Kore', 'Melka Jebdu', 'Gezira'],
    popularNeighborhoods: ['Kazira', 'Megala', 'Sabian High St', 'Taiwan Market Area'],
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
    propertyCount: 23
  }
];

export const AMENITIES_LIST = [
  { id: 'generator', name: 'Backup Generator', amName: 'የተጠባባቂ ጀነሬተር', icon: 'Zap' },
  { id: 'waterTank', name: 'Water Tank (Roto)', amName: 'የውሃ ታንከር (ሮቶ)', icon: 'Droplets' },
  { id: 'wifi', name: 'High-speed WiFi', amName: 'ፈጣን ዋይፋይ', icon: 'Wifi' },
  { id: 'parking', name: 'Dedicated Parking', amName: 'የመኪና ማቆሚያ', icon: 'Car' },
  { id: 'security', name: '24/7 Security & CCTV', amName: 'የ24 ሰዓት ጥበቃ', icon: 'ShieldCheck' },
  { id: 'elevator', name: 'Modern Elevator', amName: 'ሊፍት', icon: 'ArrowUpDown' },
  { id: 'furnished', name: 'Fully Furnished', amName: 'ሙሉ እቃ ያለው', icon: 'Sofa' },
  { id: 'balcony', name: 'Balcony / City View', amName: 'በረንዳ / ከተማ እይታ', icon: 'Sun' },
  { id: 'gym', name: 'Gym & Fitness Center', amName: 'የስፖርት ማዘውተሪያ', icon: 'Dumbbell' },
  { id: 'garden', name: 'Private Garden / Yard', amName: 'ግቢ / የአትክልት ቦታ', icon: 'Trees' },
  { id: 'kitchen', name: 'Modern Fitted Kitchen', amName: 'ዘመናዊ ኩሽና', icon: 'Utensils' },
  { id: 'maidRoom', name: "Maid's Quarter", amName: 'የሰራተኛ ክፍል', icon: 'Home' }
];

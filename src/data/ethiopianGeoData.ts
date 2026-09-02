export interface NeighborhoodGeo {
  name: string;
  nameAm: string;
  city: string;
  subcity: string;
  lat: number;
  lng: number;
  landmarks: string[];
}

export const ETHIOPIAN_CITY_CENTERS: Record<string, { lat: number; lng: number; zoom: number; nameAm: string }> = {
  'Addis Ababa': { lat: 9.0108, lng: 38.7613, zoom: 12, nameAm: 'አዲስ አበባ' },
  'Hawassa': { lat: 7.0504, lng: 38.4955, zoom: 13, nameAm: 'ሐዋሳ' },
  'Bahir Dar': { lat: 11.5742, lng: 37.3614, zoom: 13, nameAm: 'ባሕር ዳር' },
  'Bishoftu (Debre Zeyit)': { lat: 8.7523, lng: 38.9785, zoom: 13, nameAm: 'ቢሾፍቱ' },
  'Bishoftu': { lat: 8.7523, lng: 38.9785, zoom: 13, nameAm: 'ቢሾፍቱ' },
  'Adama (Nazret)': { lat: 8.5400, lng: 39.2700, zoom: 13, nameAm: 'አዳማ' },
  'Adama': { lat: 8.5400, lng: 39.2700, zoom: 13, nameAm: 'አዳማ' },
  'Dire Dawa': { lat: 9.5931, lng: 41.8661, zoom: 13, nameAm: 'ድሬዳዋ' },
  'Mekelle': { lat: 13.4967, lng: 39.4753, zoom: 13, nameAm: 'መቐለ' },
  'Gondar': { lat: 12.6075, lng: 37.4674, zoom: 13, nameAm: 'ጎንደር' }
};

export const ETHIOPIAN_NEIGHBORHOODS_GEO: NeighborhoodGeo[] = [
  // Addis Ababa - Bole
  {
    name: 'Bole Medhanialem',
    nameAm: 'ቦሌ መድኃኔዓለም',
    city: 'Addis Ababa',
    subcity: 'Bole',
    lat: 8.9952,
    lng: 38.7885,
    landmarks: ['Medhanialem Church', 'Edna Mall', 'Bole Airport Road', 'Morning Star Mall']
  },
  {
    name: 'Bole Atlas',
    nameAm: 'ቦሌ አትላስ',
    city: 'Addis Ababa',
    subcity: 'Bole',
    lat: 9.0065,
    lng: 38.7758,
    landmarks: ['Atlas Hotel Area', 'Namibia Street', 'Desalegn Hotel', 'Cameroon St']
  },
  {
    name: 'Bole Rwanda / Japan',
    nameAm: 'ቦሌ ሩዋንዳ / ጃፓን ኤምባሲ',
    city: 'Addis Ababa',
    subcity: 'Bole',
    lat: 8.9880,
    lng: 38.7790,
    landmarks: ['Japan Embassy', 'Rwanda Embassy', 'Bole Michael']
  },
  {
    name: 'Bole Brass',
    nameAm: 'ቦሌ ብራስ',
    city: 'Addis Ababa',
    subcity: 'Bole',
    lat: 8.9990,
    lng: 38.7820,
    landmarks: ['Brass Clinic Area', 'Tele Medhanialem Corridor']
  },
  {
    name: 'Gerji',
    nameAm: 'ገርጂ',
    city: 'Addis Ababa',
    subcity: 'Bole',
    lat: 8.9980,
    lng: 38.8050,
    landmarks: ['Imperial Hotel', 'Roba Bakery', 'Alfoz Plaza', 'Unity University']
  },
  {
    name: 'CMC / Sunshine',
    nameAm: 'ሲኤምሲ / ሰንሻይን',
    city: 'Addis Ababa',
    subcity: 'Yeka',
    lat: 9.0220,
    lng: 38.8350,
    landmarks: ['CMC Michael', 'Sunshine Real Estate', 'St. Michael Church', 'Civil Service University']
  },
  {
    name: 'Ayat',
    nameAm: 'አያት',
    city: 'Addis Ababa',
    subcity: 'Yeka',
    lat: 9.0340,
    lng: 38.8650,
    landmarks: ['Ayat Real Estate', 'Ayat Zone 2-8', 'LRT Terminal', 'Tafo Road']
  },
  {
    name: 'Summit',
    nameAm: 'ሰሚት',
    city: 'Addis Ababa',
    subcity: 'Bole',
    lat: 9.0210,
    lng: 38.8520,
    landmarks: ['Summit Condominiums', 'Pepsi Factory', 'Safari Junction']
  },
  {
    name: 'Megenagna',
    nameAm: 'መገናኛ',
    city: 'Addis Ababa',
    subcity: 'Yeka',
    lat: 9.0200,
    lng: 38.7990,
    landmarks: ['Zefmesh Grand Mall', 'Lem Hotel', 'Megenagna Square', 'LRT Station']
  },
  {
    name: 'Kazanchis',
    nameAm: 'ካዛንቺስ',
    city: 'Addis Ababa',
    subcity: 'Kirkos',
    lat: 9.0180,
    lng: 38.7680,
    landmarks: ['UNECA HQ', 'Radisson Blu', 'Intercontinental Hotel', 'Menelik II Palace']
  },
  {
    name: 'Meskel Flower',
    nameAm: 'መስቀል ፍላወር',
    city: 'Addis Ababa',
    subcity: 'Kirkos',
    lat: 9.0010,
    lng: 38.7570,
    landmarks: ['Meskel Flower Hotel', 'Dreamliner Hotel', 'Gazebo Square']
  },
  {
    name: 'Mexico Square',
    nameAm: 'ሜክሲኮ አደባባይ',
    city: 'Addis Ababa',
    subcity: 'Kirkos',
    lat: 9.0110,
    lng: 38.7440,
    landmarks: ['Wabi Shebelle Hotel', 'Coffee Board', 'Tebaber Berta', 'LRT Mexico']
  },
  {
    name: 'Sarbet',
    nameAm: 'ሳርቤት',
    city: 'Addis Ababa',
    subcity: 'Kirkos',
    lat: 9.0020,
    lng: 38.7360,
    landmarks: ['International Community School (ICS)', 'AU Headquarters', 'Vatican Embassy', 'Pushkin Square']
  },
  {
    name: 'Bisrate Gabriel',
    nameAm: 'ብስራተ ገብርኤል',
    city: 'Addis Ababa',
    subcity: 'Nifas Silk-Lafto',
    lat: 8.9910,
    lng: 38.7310,
    landmarks: ['St. Gabriel Church', 'Laphto Mall', 'South Africa Embassy', 'Home Depot Area']
  },
  {
    name: 'Old Airport',
    nameAm: 'ብሉይ አየር ማረፊያ (ኦልድ ኤርፖርት)',
    city: 'Addis Ababa',
    subcity: 'Nifas Silk-Lafto',
    lat: 8.9850,
    lng: 38.7290,
    landmarks: ['Golf Club', 'Victory Department Store', 'Adams Pavilion', 'ICS Corridor']
  },
  {
    name: 'Lebu / Jemo',
    nameAm: 'ለቡ / ጀሞ',
    city: 'Addis Ababa',
    subcity: 'Nifas Silk-Lafto',
    lat: 8.9620,
    lng: 38.7210,
    landmarks: ['Lebu Mebrathail', 'Musika Sefer', 'Jemo 1-3 Condominiums']
  },
  {
    name: 'Gotera',
    nameAm: 'ጎተራ',
    city: 'Addis Ababa',
    subcity: 'Kirkos',
    lat: 8.9880,
    lng: 38.7520,
    landmarks: ['Gotera Interchange', 'Pepsi Corridor', 'Agona Cinema Area']
  },
  {
    name: 'Saris / Kality',
    nameAm: 'ሳሪስ / ቃሊቲ',
    city: 'Addis Ababa',
    subcity: 'Akaky Kaliti',
    lat: 8.9480,
    lng: 38.7620,
    landmarks: ['Saris Abo Church', 'Kadisco Square', 'Kality Toll Gate']
  },
  {
    name: 'Piassa / Arada',
    nameAm: 'ፒያሳ / አራዳ',
    city: 'Addis Ababa',
    subcity: 'Arada',
    lat: 9.0330,
    lng: 38.7510,
    landmarks: ['St. George Cathedral', 'Taitu Hotel', 'Piassa Commercial Hub', 'De Gaulle Square']
  },
  // Regional Hubs
  {
    name: 'Lakefront Area',
    nameAm: 'ሐይቅ ዳርቻ (ሀዋሳ)',
    city: 'Hawassa',
    subcity: 'Haik Dar',
    lat: 7.0580,
    lng: 38.4820,
    landmarks: ['Haile Resort Hawassa', 'Lake Hawassa Promenade', 'Fish Market']
  },
  {
    name: 'Tana View Lakefront',
    nameAm: 'ጣና ቪው (ባሕር ዳር)',
    city: 'Bahir Dar',
    subcity: 'Gish Abay',
    lat: 11.5950,
    lng: 37.3780,
    landmarks: ['Lake Tana Shore', 'Avanti Blue Nile Hotel', 'Kuriftu Bahir Dar']
  },
  {
    name: 'Kuriftu Lake Zone',
    nameAm: 'ኩሪፍቱ ሐይቅ ዞን (ቢሾፍቱ)',
    city: 'Bishoftu (Debre Zeyit)',
    subcity: 'Kuriftu Area',
    lat: 8.7590,
    lng: 38.9850,
    landmarks: ['Kuriftu Resort & Spa', 'Lake Babogaya', 'Lake Bishoftu']
  },
  {
    name: 'Expressway & Ras Hotel Area',
    nameAm: 'ራስ ሆቴል እና ኤክስፕረስ ዌይ (አዳማ)',
    city: 'Adama (Nazret)',
    subcity: 'Boku Shenen',
    lat: 8.5450,
    lng: 39.2780,
    landmarks: ['Ras Hotel Adama', 'Expressway Toll Station', 'Adama Stadium']
  },
  {
    name: 'Kazira & Free Trade Corridor',
    nameAm: 'ካዚራ / የነጻ ንግድ ቀጠና (ድሬዳዋ)',
    city: 'Dire Dawa',
    subcity: 'Sabian',
    lat: 9.5980,
    lng: 41.8590,
    landmarks: ['Ethio-Djibouti Railway Station', 'Taiwan Market', 'Free Trade Zone']
  },
  {
    name: 'Ayder Referral & Romanat Square',
    nameAm: 'አይደር እና ሮማናት (መቐለ)',
    city: 'Mekelle',
    subcity: 'Ayder',
    lat: 13.4990,
    lng: 39.4790,
    landmarks: ['Ayder Referral Hospital', 'Romanat Square', 'Mekelle University']
  },
  {
    name: 'Fasil Ghebbi Castles Vicinity',
    nameAm: 'ፋሲል ግቢ አካባቢ (ጎንደር)',
    city: 'Gondar',
    subcity: 'Fasil',
    lat: 12.6080,
    lng: 37.4690,
    landmarks: ['Fasil Ghebbi UNESCO Castle', 'Piazza Gondar', 'Goha Hotel']
  }
];

export function getCoordinatesForLocation(city?: string, subcity?: string, neighborhood?: string): { lat: number; lng: number } {
  const normCity = (city || '').trim().toLowerCase();
  const normSubcity = (subcity || '').trim().toLowerCase();
  const normNeigh = (neighborhood || '').trim().toLowerCase();

  // 1. Try exact neighborhood match
  if (normNeigh) {
    const found = ETHIOPIAN_NEIGHBORHOODS_GEO.find(n => 
      n.name.toLowerCase().includes(normNeigh) || 
      normNeigh.includes(n.name.toLowerCase()) ||
      n.nameAm.includes(neighborhood || '')
    );
    if (found) return { lat: found.lat, lng: found.lng };
  }

  // 2. Try subcity match in Addis Ababa
  if (normSubcity) {
    const found = ETHIOPIAN_NEIGHBORHOODS_GEO.find(n => 
      n.subcity.toLowerCase() === normSubcity || 
      n.subcity.toLowerCase().includes(normSubcity)
    );
    if (found) return { lat: found.lat, lng: found.lng };
  }

  // 3. Try city center
  for (const [cityName, center] of Object.entries(ETHIOPIAN_CITY_CENTERS)) {
    if (normCity.includes(cityName.toLowerCase()) || cityName.toLowerCase().includes(normCity)) {
      return { lat: center.lat, lng: center.lng };
    }
  }

  // Default to Addis Ababa central coordinates
  return { lat: 9.0108, lng: 38.7613 };
}

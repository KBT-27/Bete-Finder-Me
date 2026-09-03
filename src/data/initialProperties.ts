import { Property, ListingPlan } from '../types';

export const INITIAL_PROPERTIES: Property[] = [];

export const LISTING_PLANS: ListingPlan[] = [
  {
    id: 'free',
    name: 'Free Plan',
    nameAm: 'ነፃ ፕላን (Free Plan)',
    price: 0,
    durationDays: 30,
    multiplierText: 'Standard Listing',
    multiplierTextAm: 'መደበኛ ነፃ ማስታወቂያ',
    renewInterval: 'Standard search ranking',
    renewIntervalAm: 'መደበኛ የፍለጋ ደረጃ',
    features: [
      'Standard search & interactive map placement',
      'Direct phone, WhatsApp & Telegram contact',
      'Upload high-quality property photos',
      'Display amenities & location details',
      '100% Free — No payment or Telebirr needed'
    ],
    featuresAm: [
      'በፍለጋ እና በካርታ ላይ መደበኛ ምደባ',
      'ቀጥታ የስልክ፣ ዋትስአፕ እና ቴሌግራም ግንኙነት',
      'ጥራት ያላቸው ፎቶዎችን በነፃ ማካተት',
      'የቤት መገልገያዎችን እና አድራሻን ማሳየት',
      '100% ነፃ — ምንም ክፍያ ወይም ቴሌብር አያስፈልግም'
    ]
  },
  {
    id: 'basic',
    name: 'Basic Package',
    nameAm: 'መሠረታዊ ፓኬጅ (Basic)',
    price: 299,
    durationDays: 30,
    multiplierText: 'Up to 2x more clients',
    multiplierTextAm: 'እስከ 2 እጥፍ ተጨማሪ ደንበኞች',
    renewInterval: 'Auto-renew every 48 hours',
    renewIntervalAm: 'በየ 48 ሰዓቱ በራስ-ሰር ይታደሳል',
    features: [
      'Up to 2 times more clients for ads',
      'Promotion in search results and categories',
      'Auto-renew of ads every 48 hours',
      'Direct call & Telegram inquiries',
      'Standard photo gallery'
    ],
    featuresAm: [
      'ለማስታወቂያዎች እስከ 2 እጥፍ ተጨማሪ ደንበኞች',
      'በፍለጋ ውጤቶች እና ምድቦች ውስጥ ማስተዋወቅ',
      'በየ 48 ሰዓቱ ማስታወቂያዎችን በራስ-ሰር ማደስ',
      'ቀጥታ የስልክ እና የቴሌግራም ጥያቄዎች',
      'መደበኛ የፎቶ ማሳያ'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Package',
    nameAm: 'ፕሪሚየም ፓኬጅ (Premium)',
    price: 599,
    durationDays: 30,
    isPopular: true,
    multiplierText: 'Up to 5x more clients',
    multiplierTextAm: 'እስከ 5 እጥፍ ተጨማሪ ደንበኞች',
    renewInterval: 'Auto-renew every 24 hours',
    renewIntervalAm: 'በየ 24 ሰዓቱ በራስ-ሰር ይታደሳል',
    topBadgeCount: '5 TOP+',
    topBadgeCountAm: '5 ከፍተኛ ተመራጭ (TOP+)',
    features: [
      'Up to 5 times more clients for your ads',
      'Promotion in search results and categories',
      'Auto-renew ads every 24 hours',
      '5 TOP+ featured listing spots',
      'Priority customer inquiries badge',
      'Telebirr instant payment activation'
    ],
    featuresAm: [
      'ለማስታወቂያዎ እስከ 5 እጥፍ ተጨማሪ ደንበኞች',
      'በፍለጋ ውጤቶች እና ምድቦች ውስጥ ማስተዋወቅ',
      'በየ 24 ሰዓቱ ማስታወቂያዎችን በራስ-ሰር ማደስ',
      '5 ከፍተኛ ተመራጭ ማስታወቂያዎች (5 TOP+)',
      'ቅድሚያ የሚሰጠው የደንበኞች ጥሪ ባጅ',
      'በቴሌብር ፈጣን ክፍያ ማረጋገጫ'
    ]
  },
  {
    id: 'vip',
    name: 'VIP Package',
    nameAm: 'ቪአይፒ ፓኬጅ (VIP)',
    price: 999,
    durationDays: 30,
    multiplierText: 'Up to 7x more clients',
    multiplierTextAm: 'እስከ 7 እጥፍ ተጨማሪ ደንበኞች',
    renewInterval: 'Auto-renew every 12 hours',
    renewIntervalAm: 'በየ 12 ሰዓቱ በራስ-ሰር ይታደሳል',
    topBadgeCount: '10 VIP TOP+',
    topBadgeCountAm: '10 ቪአይፒ ከፍተኛ ተመራጭ (10 VIP TOP+)',
    features: [
      'Up to 7 times more clients for ads',
      'Promotion in search results and categories',
      'Auto-renew ads every 12 hours',
      '10 VIP TOP+ maximum exposure spots',
      '100% Verified by the Owner badge',
      'Top homepage banner & carousel spotlight',
      'Direct Telegram & Phone VIP concierge'
    ],
    featuresAm: [
      'ለማስታወቂያዎች እስከ 7 እጥፍ ተጨማሪ ደንበኞች',
      'በፍለጋ ውጤቶች እና ምድቦች ውስጥ ማስተዋወቅ',
      'በየ 12 ሰዓቱ ማስታወቂያዎችን በራስ-ሰር ማደስ',
      '10 ቪአይፒ ከፍተኛ ተመራጭ ቦታዎች (10 VIP TOP+)',
      'በባለቤቱ ሙሉ በሙሉ የተረጋገጠ (Verified by Owner)',
      'በዋናው ገፅ ከፍተኛ ስፖትላይት እና ባነር',
      'የቀጥታ የቴሌግራም እና ስልክ የቪአይፒ ድጋፍ'
    ]
  }
];

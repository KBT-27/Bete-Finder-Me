export const DEFAULT_OWNER_PHOTO = '/owner-kaleb.svg';

export interface AvatarPreset {
  id: string;
  name: string;
  nameAmharic: string;
  url: string;
  category: 'owner' | 'professional' | 'minimal';
  badge?: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'owner-kaleb-official',
    name: 'Kaleb Bereket (Official Owner)',
    nameAmharic: 'ካሌብ በረከት (የባለቤቱ ይፋዊ ፎቶ)',
    url: '/owner-kaleb.svg',
    category: 'owner',
    badge: '👑 Official Owner'
  },
  {
    id: 'exec-1',
    name: 'Executive Business',
    nameAmharic: 'የንግድ መሪ',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    category: 'professional',
    badge: '💼 Executive'
  },
  {
    id: 'exec-2',
    name: 'Tech Founder',
    nameAmharic: 'የቴክኖሎጂ መሪ',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    category: 'professional',
    badge: '🚀 Founder'
  },
  {
    id: 'real-estate-pro',
    name: 'Property Specialist',
    nameAmharic: 'የቤት ባለሙያ',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    category: 'professional',
    badge: '🏢 Specialist'
  },
  {
    id: 'minimalist-avatar',
    name: 'Modern Resident',
    nameAmharic: 'ዘመናዊ ተከራይ/ተጠቃሚ',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    category: 'minimal',
    badge: '🌱 Resident'
  }
];

/**
 * Optimizes an uploaded image file into a square web-friendly Data URL
 * suitable for localStorage and backend sync.
 */
export const processUploadedImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400; // 400x400 high resolution avatar
        
        let width = img.width;
        let height = img.height;

        // Crop to square from center
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw cropped & scaled square
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxSize, maxSize);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

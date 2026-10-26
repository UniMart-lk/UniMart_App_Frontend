export const products = [
  {
    id: '1',
    title: 'Calculus Textbook',
    price: 'LKR 1,500',
    numericPrice: 1500,
    condition: 'Like New',
    location: 'Sabaragamuwa Uni',
    providerType: 'student',
    category: 'Books', 
    rating: '4.8', 
    description: 'Well-maintained Calculus textbook. No torn pages or heavy highlighting. Perfect for first-year engineering students.',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
      'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&q=80'
    ],
    details: [
      { label: 'Subject', value: 'Mathematics' },
      { label: 'Edition', value: '10th Edition' },
      { label: 'Author', value: 'Howard Anton' },
      { label: 'Format', value: 'Paperback' },
      { label: 'Condition', value: 'Like New' }
    ],
    locationDetails: {
      address: 'Sabaragamuwa University, Belihuloya',
      mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
    },
    provider: {
      name: 'Dilshan Silva',
      type: 'Student Provider',
      isVerified: true,
      rating: '4.8',
      reviewsCount: 18,
      memberSince: 'Mar 2024',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80'
    }
  },
  {
    id: '2',
    title: 'iPhone 11 64GB — Black',
    price: 'LKR 85,000',
    numericPrice: 85000,
    condition: 'Good',
    location: 'Kandy',
    providerType: 'external',
    category: 'Electronics',
    rating: '4.9', 
    description: 'Well-maintained iPhone 11, 64GB storage. Battery health 89%. Comes with original charger. Minor scratches on back, screen is flawless. Reason for selling: upgraded.',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80'
    ],
    details: [
      { label: 'Brand', value: 'Apple' },
      { label: 'Model', value: 'iPhone 11' },
      { label: 'Storage', value: '64GB' },
      { label: 'Color', value: 'Black' },
      { label: 'Battery Health', value: '89%' }
    ],
    locationDetails: {
      address: 'Kandy, Central Province',
      mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
    },
    provider: {
      name: 'Kasun Perera',
      type: 'External Provider',
      isVerified: true,
      rating: '4.8',
      reviewsCount: 25,
      memberSince: 'Jan 2025',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
    }
  },
  {
    id: '3',
    title: 'Wooden Study Table',
    price: 'LKR 8,500',
    numericPrice: 8500,
    condition: 'Used',
    location: 'Belihuloya',
    providerType: 'student',
    category: 'Furniture',
    rating: '4.5', 
    description: 'Sturdy wooden study table. Has a few scratches from normal use but is very strong and perfect for studying.',
    images: [
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80'
    ],
    details: [
      { label: 'Material', value: 'Teak Wood' },
      { label: 'Dimensions', value: '4ft x 2.5ft' },
      { label: 'Color', value: 'Natural Brown' },
      { label: 'Condition', value: 'Used' }
    ],
    locationDetails: {
      address: 'Belihuloya, Sabaragamuwa Province',
      mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
    },
    provider: {
      name: 'Nimal Bandara',
      type: 'Student Provider',
      isVerified: true,
      rating: '4.5',
      reviewsCount: 14,
      memberSince: 'Oct 2024',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
    }
  },
  {
    id: '4',
    title: 'Mountain Bike',
    price: 'LKR 22,000',
    numericPrice: 22000,
    condition: 'Like New',
    location: 'Balangoda',
    providerType: 'student',
    category: 'Furniture',
    rating: '4.8', 
    description: '21-speed mountain bike. Recently serviced brakes and tires. Ideal for campus commuting.',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80'
    ],
    details: [
      { label: 'Brand', value: 'Trek' },
      { label: 'Type', value: 'Mountain Bike' },
      { label: 'Gear Count', value: '21-Speed' },
      { label: 'Wheel Size', value: '27.5 inch' },
      { label: 'Brakes', value: 'Disc Brakes' }
    ],
    locationDetails: {
      address: 'Balangoda, Sabaragamuwa Province',
      mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
    },
    provider: {
      name: 'Saman Kumara',
      type: 'Student Provider',
      isVerified: true,
      rating: '4.8',
      reviewsCount: 30,
      memberSince: 'Feb 2024',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80'
    }
  },
];
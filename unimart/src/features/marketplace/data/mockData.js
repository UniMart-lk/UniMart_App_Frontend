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
    reviewsCount: '4.8k', 
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
    },
    reviews: [
      {
        id: 'rev-1-1',
        name: 'Kasun Madushanka',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        rating: 5,
        date: '2 days ago',
        comment: 'The book is in exceptional condition, just like new as described. No torn pages, and formulas are all intact. Great seller!',
        verified: true
      },
      {
        id: 'rev-1-2',
        name: 'Malithi Fernando',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        rating: 5,
        date: '5 days ago',
        comment: 'Saved me a lot of money compared to buying brand new from bookshops. Fast response and handed it over near the Faculty canteen.',
        verified: true
      },
      {
        id: 'rev-1-3',
        name: 'Dineth Wickramasinghe',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
        rating: 4.5,
        date: '1 week ago',
        comment: 'Very clean copy with minimal pencil notes in chapter 3. Very satisfied with the purchase and communication.',
        verified: true
      },
      {
        id: 'rev-1-4',
        name: 'Sanduni Senanayake',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Highly recommended for first-year engineering mathematics! Howard Anton 10th edition has all the tutorial problem sets.',
        verified: true
      },
      {
        id: 'rev-1-5',
        name: 'Tharindu Jayasuriya',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
        rating: 5,
        date: '3 weeks ago',
        comment: 'Super friendly student seller. Handover was smooth at the main library entrance.',
        verified: true
      },
      {
        id: 'rev-1-6',
        name: 'Anuki Alwis',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
        rating: 4,
        date: '1 month ago',
        comment: 'Solid binding and cover is well protected. Really good deal for LKR 1,500.',
        verified: false
      },
      {
        id: 'rev-1-7',
        name: 'Kavindu Bandara',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
        rating: 5,
        date: '1 month ago',
        comment: 'Helped me prep for my mid-term exam. The diagrams and solved exercises are crisp.',
        verified: true
      },
      {
        id: 'rev-1-8',
        name: 'Oshadi Ranasinghe',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
        rating: 5,
        date: '2 months ago',
        comment: 'Clear text, no highlighting or stains at all. Exactly matched the listing photos.',
        verified: true
      },
      {
        id: 'rev-1-9',
        name: 'Nuwan Pradeep',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&q=80',
        rating: 4.5,
        date: '2 months ago',
        comment: 'Seller was prompt and patient when answering questions regarding the edition and syllabus match.',
        verified: true
      },
      {
        id: 'rev-1-10',
        name: 'Rashmi Perera',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80',
        rating: 5,
        date: '3 months ago',
        comment: 'Essential textbook for pure and applied mathematics. A must have for university students!',
        verified: true
      }
    ]
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
    reviewsCount: '1.2k',
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
    },
    reviews: [
      {
        id: 'rev-2-1',
        name: 'Sachintha De Silva',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        rating: 5,
        date: '3 days ago',
        comment: 'Device is in great condition, 89% battery health confirmed via settings. FaceID works flawlessly.',
        verified: true
      },
      {
        id: 'rev-2-2',
        name: 'Nadeesha Kumari',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        rating: 5,
        date: '1 week ago',
        comment: 'Seller provided original box and charging cable. Trustworthy and quick deal in Kandy town.',
        verified: true
      },
      {
        id: 'rev-2-3',
        name: 'Praveen Ratnayake',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
        rating: 4.5,
        date: '2 weeks ago',
        comment: 'Cameras take crisp photos, speakers are loud and clear. Very happy with the purchase.',
        verified: true
      },
      {
        id: 'rev-2-4',
        name: 'Hansani Wickrama',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        rating: 5,
        date: '3 weeks ago',
        comment: 'Great budget iPhone option for campus work and photography. Responsive seller!',
        verified: true
      },
      {
        id: 'rev-2-5',
        name: 'Chathura Gunawardena',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
        rating: 4,
        date: '1 month ago',
        comment: 'Minor wear around the edges as described, but display is pristine.',
        verified: false
      },
      {
        id: 'rev-2-6',
        name: 'Isuri Dissanayake',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80',
        rating: 5,
        date: '1 month ago',
        comment: 'Everything was reset and ready for new Apple ID setup. Recommended seller.',
        verified: true
      },
      {
        id: 'rev-2-7',
        name: 'Lahiru Mendis',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
        rating: 5,
        date: '2 months ago',
        comment: 'Battery easily lasts the whole university day. Trustworthy seller.',
        verified: true
      }
    ]
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
    reviewsCount: '340',
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
    },
    reviews: [
      {
        id: 'rev-3-1',
        name: 'Vimukthi Weerasinghe',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        rating: 5,
        date: '4 days ago',
        comment: 'Very solid and heavy teak wood. Perfect size for my hostel room laptop setup.',
        verified: true
      },
      {
        id: 'rev-3-2',
        name: 'Janaki Jayawardena',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        rating: 4.5,
        date: '2 weeks ago',
        comment: 'Good value for money. Handover was easy with help loading into a trishaw.',
        verified: true
      },
      {
        id: 'rev-3-3',
        name: 'Supun Maduranga',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
        rating: 4,
        date: '3 weeks ago',
        comment: 'Has minor scratches as mentioned, but structure is 100% durable and stable.',
        verified: false
      },
      {
        id: 'rev-3-4',
        name: 'Kaushalya Ranatunga',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        rating: 5,
        date: '1 month ago',
        comment: 'Polished it with a little teak oil and looks almost new! Recommended seller.',
        verified: true
      },
      {
        id: 'rev-3-5',
        name: 'Dulantha Alahakoon',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
        rating: 4.5,
        date: '2 months ago',
        comment: 'Very accommodating seller and polite communication.',
        verified: true
      }
    ]
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
    reviewsCount: '620',
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
    },
    reviews: [
      {
        id: 'rev-4-1',
        name: 'Avishka Dilshan',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
        rating: 5,
        date: '5 days ago',
        comment: 'Tackles the Sabaragamuwa university hills effortlessly! Brakes and gear shifts are super responsive.',
        verified: true
      },
      {
        id: 'rev-4-2',
        name: 'Chamathka Karunaratne',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
        rating: 5,
        date: '1 week ago',
        comment: 'Bike came freshly tuned with free bell and reflector attached. Great deal!',
        verified: true
      },
      {
        id: 'rev-4-3',
        name: 'Gayan Pathirana',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&q=80',
        rating: 4.5,
        date: '3 weeks ago',
        comment: 'Tires have plenty of grip left. Great for daily riding between hostel and faculty.',
        verified: true
      },
      {
        id: 'rev-4-4',
        name: 'Ruvini Samarasinghe',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        rating: 5,
        date: '1 month ago',
        comment: 'Smooth suspension and comfortable saddle for long campus rides.',
        verified: true
      },
      {
        id: 'rev-4-5',
        name: 'Harsha Basnayake',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
        rating: 4.5,
        date: '2 months ago',
        comment: 'Excellent condition as advertised. Seller even provided a bicycle pump.',
        verified: true
      }
    ]
  },
];
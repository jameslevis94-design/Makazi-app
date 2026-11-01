import { House, Booking, Conversation } from './types';

export const INITIAL_HOUSES: House[] = [
  {
    id: 'h1',
    title: 'Aura Waterfront Estate',
    description: 'Breathtaking beachfront architectural marvel with expansive glass walls, a private infinity pool, and panoramic ocean vistas. Experience supreme Malibu luxury with steps directly to the sand, open-concept spaces, and state-of-the-art automation.',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Malibu, California',
    dateRange: 'Jun 15 - 22',
    amount: 1400000,
    rating: 4.95,
    beds: 4,
    baths: 4.5,
    maxGuests: 8,
    propertyStatus: 'For Rent',
    size: '420 sqm',
    host: {
      name: 'Elena Rostova',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.9
    },
    features: ['Ocean Front', 'Infinity Pool', 'Private Beach Access', 'Heated Spa', 'Chef Kitchen', 'Self room'],
    reviews: [
      { author: 'Clara Jenkins', text: 'An absolute masterpiece of a home. We watched dolphins play right from our breakfast table. Elena was a master-class host.', rating: 5 },
      { author: 'Brandon Miller', text: 'Exceptional details, pristine cleanliness, and standard-setting design. Worth every dollar.', rating: 5 }
    ]
  },
  {
    id: 'h2',
    title: 'Summit Peak Chalet',
    description: 'Ultra-luxurious alpine refuge facing the iconic peak of the Matterhorn. Crafted with century-old reclaimed wood, French limestone, and premium natural furs, this ski-in/ski-out lodge offers absolute alpine bliss with an indoor pool and steaming outdoor hot tub.',
    images: [
      'https://images.unsplash.com/photo-1502005229762-fc1b2b812ca5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Zermatt, Switzerland',
    dateRange: 'Jul 02 - 09',
    amount: 1800000,
    rating: 4.98,
    beds: 5,
    baths: 5,
    maxGuests: 10,
    propertyStatus: 'For Rent',
    size: '510 sqm',
    host: {
      name: 'Hans Keller',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.97
    },
    features: ['Ski-in/Ski-out', 'Mountain View', 'Outdoor Hot Tub', 'Fireplace', 'Sauna', 'Self room'],
    reviews: [
      { author: 'Jonathan V.', text: 'Skiing into the villa and stepping directly into the sauna is an experience we will cherish forever. Hans is exceptionally attentive.', rating: 5 }
    ]
  },
  {
    id: 'h3',
    title: 'The Obsidian Pavilion',
    description: 'Immerse yourself in Zen serenity in this award-winning modern Interpretation of a traditional Japanese tea house. Overlooking private bamboo gardens with natural moss hills, custom-crafted hinoki cedar bathtubs, and hand-woven tatami mats.',
    images: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Kyoto, Japan',
    dateRange: 'Jun 28 - Jul 05',
    amount: 800000,
    rating: 4.92,
    beds: 2,
    baths: 2,
    maxGuests: 4,
    propertyStatus: 'For Rent',
    size: '280 sqm',
    host: {
      name: 'Kenji Sato',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.88
    },
    features: ['Zen Garden', 'Hinoki Wood Bath', 'Tatami Rooms', 'Tea Lounge', 'Mountain Air', 'Chumba kimoja'],
    reviews: [
      { author: 'Sophie Tremblay', text: 'Peaceful, immaculate, and culturally inspiring. Hearing the rain hit the bamboo garden from the bath is pure meditation.', rating: 5 }
    ]
  },
  {
    id: 'h4',
    title: 'Glass Forest Sentry',
    description: 'An architectural marvel suspended in the forest canopy. Blurring the lines between indoors and nature, this minimalist glass pavilion features dramatic structural geometry, heated polished concrete floors, and a gorgeous cedar soaking tub under the stars.',
    images: [
      'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Portland, Oregon',
    dateRange: 'Jun 12 - 17',
    amount: 600000,
    rating: 4.89,
    beds: 1,
    baths: 1.5,
    maxGuests: 2,
    propertyStatus: 'For Rent',
    size: '150 sqm',
    host: {
      name: 'Sarah Wilde',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.91
    },
    features: ['Forest Views', 'Wood Fireplace', 'Cedar Tub', 'Minimalist Design', 'Surround Sound', 'Lodge room', 'Logde room'],
    reviews: [
      { author: 'Liam Patterson', text: 'A completely unique architectural experience among the fir trees. Incredible sound system and host care.', rating: 5 }
    ]
  },
  {
    id: 'h5',
    title: 'Riad Jasmine Dream',
    description: 'An oasis of tranquility nested within the ancient Medina. Features intricate hand-carved arabesque tilework, a shimmering emerald central pool courtyard, a lush citrus terrace, and sunset dining views overlooking the Atlas Mountains.',
    images: [
      'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Marrakech, Morocco',
    dateRange: 'Sep 10 - 17',
    amount: 500000,
    rating: 4.86,
    beds: 3,
    baths: 3,
    maxGuests: 6,
    propertyStatus: 'For Rent',
    size: '320 sqm',
    host: {
      name: 'Amine Alaoui',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.95
    },
    features: ['Central Riad Pool', 'Citrus Garden', 'Rooftop Terrace', 'Moroccan Hammam', 'Traditional Breakfast', 'Lodge room', 'Chumba kimoja'],
    reviews: [
      { author: 'Nadia K.', text: 'Amine greeted us with fresh mint tea and local pastries. The courtyard is peaceful beyond words.', rating: 5 }
    ]
  },
  {
    id: 'h6',
    title: 'Manhattan Penthouse No. 9',
    description: 'High-concept skyloft showcasing double-height floor-to-ceiling iron-frame windows overlooking the epic cityscape. Hand-curated modern art collection, custom dark concrete finishes, a private rooftop deck, and custom integrated wellness therapy room.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'New York, New York',
    dateRange: 'Jul 20 - 27',
    amount: 1750000,
    rating: 4.94,
    beds: 3,
    baths: 3,
    maxGuests: 6,
    propertyStatus: 'For Rent',
    size: '380 sqm',
    host: {
      name: 'Marcus Vance',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.85
    },
    features: ['Skyline View', 'Rooftop Lounge', 'Private Steam Bath', 'Art Collection', 'Gym Access', 'Kiwanja', 'NHF'],
    reviews: [
      { author: 'Danielle Moore', text: 'Stunning city views, high ceiling grandeur, and exceptional interior curation. Will return for my next NY stay.', rating: 5 }
    ]
  },
  {
    id: 'h7',
    title: 'Kariakoo Premium Business Frame',
    description: 'Highly profitable, lockable business frame (fremu ya biashara) located in the prime commercial hub of Kariakoo. Features a glass storefront, independent LUKU electricity meter, steel roller shutters, and premium tiled floors. Perfect for wholesale cosmetic boutiques or apparel stores.',
    images: [
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Kariakoo, Dar es Salaam',
    dateRange: 'Immediate Occupancy',
    amount: 400000,
    rating: 4.9,
    beds: 0,
    baths: 1,
    maxGuests: 4,
    propertyStatus: 'For Rent',
    size: '45 sqm',
    host: {
      name: 'Salome Mrema',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.8
    },
    features: ['Fremu ya Biashara', 'Fremu za biashara', 'Independent LUKU', 'Glass Showcase', 'Roller Shutters', 'Prime Location'],
    reviews: [
      { author: 'Jackson Peter', text: 'Best business location. Super easy to receive customers and highly secure steel frame system.', rating: 5 }
    ]
  },
  {
    id: 'h8',
    title: 'Sinza Deluxe Retail Frame (Fremu)',
    description: 'Chic modern business frame with full-length glass display borders on the busy Sinza road. Equipped with integrated air-conditioning connections, luxury LED track lighting, and a small back office with private restroom. Perfect for high-end boutique houses or executive salon startups.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Sinza, Dar es Salaam',
    dateRange: 'Ready for Rent',
    amount: 550000,
    rating: 4.85,
    beds: 0,
    baths: 1,
    maxGuests: 6,
    propertyStatus: 'For Rent',
    size: '60 sqm',
    host: {
      name: 'Salome Mrema',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.8
    },
    features: ['Fremu ya Biashara', 'Fremu za biashara', 'Air Conditioning', 'LED Spotlight', 'Private Washroom', 'Asphalt Access'],
    reviews: [
      { author: 'Fatma J.', text: 'The glass frontage brings in natural foot traffic. Wonderful assistance from Mama Salome.', rating: 5 }
    ]
  },
  {
    id: 'h9',
    title: 'Kigamboni Beachfront Kiwanja (Plot)',
    description: 'Beautiful surveyed beachfront residential land plot (kiwanja) in Kigamboni, Dar es Salaam. Ideal for hotel construction, commercial frame centers, or luxury family residence. Full title deed (Hati ya kiwanja) available immediately.',
    images: [
      'https://images.unsplash.com/photo-1547156521-77bd85671d30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Kigamboni, Dar es Salaam',
    dateRange: 'Immediate Transfer',
    amount: 3600000,
    rating: 4.9,
    beds: 0,
    baths: 0,
    maxGuests: 4,
    propertyStatus: 'For Sale',
    size: '1200 sqm',
    host: {
      name: 'Abubakar Mwinyi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.8
    },
    features: ['Kiwanja', 'Kiwanja and NHF', 'Surveyed Land', 'Title Deed', 'Kigamboni', 'NHF Housing Zone'],
    reviews: [
      { author: 'Salum K.', text: 'Great investment land. The plot boundaries are perfectly clear and documents verified.', rating: 5 }
    ]
  },
  {
    id: 'h10',
    title: 'NHF Kijichi Residential Estate',
    description: 'Modern NHF (National Housing Corporation / NHF) secure gated flat apartment close to main roads in Dar es Salaam. Features high-speed water supply, secure gated compound, and official certification.',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80'
    ],
    location: 'Kijichi, Dar es Salaam',
    dateRange: 'Ready for Rent',
    amount: 830000,
    rating: 4.75,
    beds: 3,
    baths: 2,
    maxGuests: 6,
    propertyStatus: 'For Rent',
    size: '140 sqm',
    host: {
      name: 'Fatma Juma',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
      rating: 4.7
    },
    features: ['NHF Apartment', 'Kiwanja and NHF', 'Secure Gated', 'High Speed Water', 'Kijichi', 'Kiwanja'],
    reviews: [
      { author: 'Elisha M.', text: 'Very quiet and neat housing block. Exactly what NHF estates are praised for.', rating: 5 }
    ]
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    house: INITIAL_HOUSES[2], // Kyoto
    startDate: '2026-06-28',
    endDate: '2026-07-05',
    guests: 2,
    totalPrice: 2170,
    status: 'upcoming'
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    house: INITIAL_HOUSES[0], // Malibu
    lastMessage: 'Let me know if you would like me to set up a personal wine tasting experience.',
    lastUpdated: '10:45 AM',
    messages: [
      { id: 'm1', sender: 'user', text: 'Hi Elena! Just booked your ocean front estate for our anniversary. We are incredibly excited!', timestamp: '10:30 AM' },
      { id: 'm2', sender: 'host', text: 'Congratulations on your upcoming anniversary! I will make sure the home is prepared with fresh flowers.', timestamp: '10:38 AM' },
      { id: 'm3', sender: 'host', text: 'Let me know if you would like me to set up a personal wine tasting experience.', timestamp: '10:45 AM' }
    ]
  },
  {
    id: 'c2',
    house: INITIAL_HOUSES[2], // Kyoto
    lastMessage: 'Awesome, looking forward to welcoming you soon in Kyoto!',
    lastUpdated: 'Yesterday',
    messages: [
      { id: 'm4', sender: 'user', text: 'Hi Sato, does the Hinoki wood tub have temperature options?', timestamp: '2:15 PM' },
      { id: 'm5', sender: 'host', text: 'Hello! Yes, it is fully connected to our natural gas continuous circulating heating system. I can preheat it for you.', timestamp: '2:30 PM' },
      { id: 'm6', sender: 'user', text: 'Amazing, thank you. That is perfect.', timestamp: '3:00 PM' },
      { id: 'm7', sender: 'host', text: 'Awesome, looking forward to welcoming you soon in Kyoto!', timestamp: '3:05 PM' }
    ]
  }
];

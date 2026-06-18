export const MANGO_CATEGORIES = [
  { name: "Chaunsa Mango", slug: "chaunsa-mango" },
  { name: "White Chaunsa", slug: "white-chaunsa" },
  { name: "Sindhri Mango", slug: "sindhri-mango" },
  { name: "Anwar Ratol", slug: "anwar-ratol" },
  { name: "Langra Mango", slug: "langra-mango" },
  { name: "Dussehri Mango", slug: "dussehri-mango" },
  { name: "Desi Mango", slug: "desi-mango" },
] as const;

export type MangoProductSeed = {
  slug: string;
  name: string;
  categorySlug: string;
  image: string;
  alt: string;
  minPrice: number;
  maxPrice?: number;
  compareAtPrice?: number;
  onSale: boolean;
  featured: boolean;
  mostLoved: boolean;
  weights?: ("10kg" | "5kg")[];
  weightPrices?: Partial<Record<"10kg" | "5kg", number>>;
  action: "select" | "cart";
  shortDescription: string;
  descriptionTitle: string;
  descriptionParagraphs: string[];
  additionalInfo: { label: string; value: string }[];
  gallery?: string[];
  stock?: number;
};

export const MANGO_PRODUCTS: MangoProductSeed[] = [
  {
    slug: "chaunsa",
    name: "Chaunsa",
    categorySlug: "chaunsa-mango",
    image: "/images/chaunsa-premium-variety.png",
    alt: "Chaunsa premium mangoes",
    minPrice: 1500,
    maxPrice: 2500,
    onSale: false,
    featured: true,
    mostLoved: true,
    weights: ["10kg", "5kg"],
    weightPrices: { "5kg": 1500, "10kg": 2500 },
    action: "select",
    shortDescription:
      "Multan's legendary Chaunsa — golden, aromatic, and honey-sweet with a rich, fiber-free pulp loved across Pakistan and abroad.",
    descriptionTitle: "Chaunsa – King of Fruits",
    descriptionParagraphs: [
      "Chaunsa mango is widely regarded as the king of fruits in Pakistan. Grown in the fertile orchards of Multan, its honey-sweet pulp and rich aroma make it a favourite for export and gifting.",
      "E Royal Mango selects only export-grade Chaunsa, packed with care to preserve freshness from orchard to your doorstep.",
    ],
    additionalInfo: [
      { label: "Origin", value: "Multan, Punjab" },
      { label: "Season", value: "June – August" },
      { label: "Packaging", value: "Gift box or crate options" },
    ],
    gallery: ["/images/chaunsa-premium-variety.png", "/images/chaunsa-mango-premium.png"],
    stock: 100,
  },
  {
    slug: "white-chaunsa",
    name: "White Chaunsa",
    categorySlug: "white-chaunsa",
    image: "/images/chaunsa-mango-premium.png",
    alt: "White Chaunsa mangoes",
    minPrice: 1500,
    maxPrice: 2500,
    onSale: false,
    featured: true,
    mostLoved: false,
    weights: ["10kg", "5kg"],
    weightPrices: { "5kg": 1500, "10kg": 2500 },
    action: "select",
    shortDescription:
      "White Chaunsa offers a lighter hue and exceptionally sweet, fibre-free flesh — a premium Chaunsa cultivar for discerning tastes.",
    descriptionTitle: "White Chaunsa – Premium Cultivar",
    descriptionParagraphs: [
      "White Chaunsa is selected for its pale golden flesh and intense sweetness. A rare treat during peak Chaunsa season.",
      "Perfect for luxury hampers, corporate gifting, and export orders requiring the finest presentation.",
    ],
    additionalInfo: [
      { label: "Origin", value: "Multan, Punjab" },
      { label: "Grade", value: "Export premium" },
      { label: "Packaging", value: "Wooden crate option" },
    ],
    gallery: ["/images/chaunsa-mango-premium.png"],
    stock: 80,
  },
  {
    slug: "sindhri-mango",
    name: "Sindhri Mango",
    categorySlug: "sindhri-mango",
    image: "/images/dasheri-mango.png",
    alt: "Sindhri mango — golden and aromatic",
    minPrice: 2000,
    maxPrice: 3300,
    onSale: false,
    featured: true,
    mostLoved: true,
    weights: ["10kg", "5kg"],
    weightPrices: { "5kg": 2000, "10kg": 3300 },
    action: "select",
    shortDescription:
      "Large, golden Sindhri mangoes with a rich aroma and buttery sweetness — the pride of Sindh and a household favourite nationwide.",
    descriptionTitle: "Sindhri Mango – The King of Early Summer",
    descriptionParagraphs: [
      "Sindhri is celebrated for its size, fragrance, and honey-like sweetness. The golden skin and generous pulp make it ideal for families and gifting.",
      "Our Sindhri mangoes are sourced from trusted Sindh orchards, graded for export quality, and packed to arrive fresh and flawless.",
    ],
    additionalInfo: [
      { label: "Origin", value: "Sindh, Pakistan" },
      { label: "Season", value: "May – July" },
      { label: "Packaging", value: "Foam-lined export boxes" },
    ],
    stock: 90,
  },
  {
    slug: "anwar-ratol",
    name: "Anwar Ratol",
    categorySlug: "anwar-ratol",
    image: "/images/anwar-ratol-mango.png",
    alt: "Anwar Ratol premium mangoes",
    minPrice: 2000,
    maxPrice: 3300,
    onSale: false,
    featured: true,
    mostLoved: true,
    weights: ["10kg", "5kg"],
    weightPrices: { "5kg": 2000, "10kg": 3300 },
    action: "select",
    shortDescription:
      "Petite, fiber-free Anwar Ratol mangoes with intense honey-sweet flavor — a connoisseur favourite from Punjab's finest orchards.",
    descriptionTitle: "Anwar Ratol – The Jewel of Multan",
    descriptionParagraphs: [
      "Anwar Ratol is prized for its small size, vibrant aroma, and melt-in-the-mouth sweetness. Each mango is hand-selected at peak ripeness for export and gift orders.",
      "Perfect for personal indulgence or premium gifting, our Anwar Ratol arrives orchard-fresh with royal-grade packaging and nationwide delivery.",
    ],
    additionalInfo: [
      { label: "Origin", value: "Multan, Punjab" },
      { label: "Season", value: "June – August" },
      { label: "Packaging", value: "Export-grade foam & crate" },
    ],
    gallery: ["/images/anwar-ratol-mango.png"],
    stock: 60,
  },
  {
    slug: "langra",
    name: "Langra Mango",
    categorySlug: "langra-mango",
    image: "/images/chaunsa-hand-picked.png",
    alt: "Langra mangoes",
    minPrice: 1800,
    maxPrice: 2800,
    onSale: false,
    featured: false,
    mostLoved: false,
    weights: ["10kg", "5kg"],
    weightPrices: { "5kg": 1800, "10kg": 2800 },
    action: "select",
    shortDescription:
      "Langra mangoes are green-skinned with a distinctive tangy-sweet profile — a classic variety for true mango lovers.",
    descriptionTitle: "Langra – The Green Treasure",
    descriptionParagraphs: [
      "Langra retains its green colour when ripe and delivers a unique flavour loved across South Asia. Hand-picked for consistent quality.",
      "Choose your preferred pack size and enjoy orchard-fresh Langra delivered with E Royal Mango's royal care.",
    ],
    additionalInfo: [
      { label: "Origin", value: "Multan & surrounds" },
      { label: "Ripeness", value: "Green when ripe" },
      { label: "Packaging", value: "Standard export carton" },
    ],
    stock: 70,
  },
  {
    slug: "dussehri",
    name: "Dussehri Mango",
    categorySlug: "dussehri-mango",
    image: "/images/dasheri-mango.png",
    alt: "Dussehri mangoes",
    minPrice: 1500,
    maxPrice: 2500,
    onSale: false,
    featured: false,
    mostLoved: true,
    weights: ["10kg", "5kg"],
    weightPrices: { "5kg": 1500, "10kg": 2500 },
    action: "select",
    shortDescription:
      "Dussehri mangoes offer a delicate sweetness and smooth texture — a timeless North Indian and Pakistani favourite.",
    descriptionTitle: "Dussehri – Smooth & Sweet",
    descriptionParagraphs: [
      "Dussehri is known for its thin skin, minimal fibre, and balanced sweetness. Our selection comes from trusted growers in the mango belt.",
      "Available in 5kg and 10kg packs for home, gifting, and hospitality.",
    ],
    additionalInfo: [
      { label: "Origin", value: "Punjab" },
      { label: "Texture", value: "Smooth, low fibre" },
      { label: "Packaging", value: "Ventilated export cartons" },
    ],
    stock: 85,
  },
  {
    slug: "desi-mango",
    name: "Desi Mango",
    categorySlug: "desi-mango",
    image: "/images/chaunsa-mango-premium.png",
    alt: "Desi mango — orchard fresh",
    minPrice: 900,
    compareAtPrice: 500,
    onSale: false,
    featured: false,
    mostLoved: true,
    action: "cart",
    shortDescription:
      "Classic desi variety — affordable, flavourful, and perfect for everyday enjoyment straight from Pakistani orchards.",
    descriptionTitle: "Desi Mango – Orchard Fresh",
    descriptionParagraphs: [
      "Our desi mangoes deliver authentic local flavour at exceptional value. Ideal for families and bulk orders during peak season.",
      "Each order is picked fresh and shipped quickly to ensure you receive mangoes at their best.",
    ],
    additionalInfo: [
      { label: "Origin", value: "Punjab & Sindh" },
      { label: "Weight", value: "Per crate / box" },
      { label: "Best for", value: "Family packs" },
    ],
    stock: 120,
  },
];

export const BENEFITS_CARDS = [
  { icon: "Sparkles", title: "Rich In Vitamins", description: "Packed with vitamins A, C, and E — nature's golden nourishment in every bite.", sortOrder: 0 },
  { icon: "Leaf", title: "Aids Digestion", description: "Natural enzymes and fiber support gentle, healthy digestion after every serving.", sortOrder: 1 },
  { icon: "Shield", title: "Boosts Immunity", description: "Antioxidants and micronutrients help strengthen your body's natural defenses.", sortOrder: 2 },
];

export const GALLERY_ITEMS = [
  { image: "/images/chaunsa-premium-variety.png", alt: "Premium Chaunsa mangoes", category: "Chaunsa", sortOrder: 0 },
  { image: "/images/anwar-ratol-mango.png", alt: "Anwar Ratol selection", category: "Anwar Ratol", sortOrder: 1 },
  { image: "/images/dasheri-mango.png", alt: "Golden Sindhri mangoes", category: "Sindhri", sortOrder: 2 },
];

export const TESTIMONIALS = [
  { customerName: "Sarah Ahmed", location: "Lahore, Pakistan", rating: 5, review: "The Chaunsa mangoes arrived perfectly ripe — sweet, fragrant, and absolutely export quality. E Royal Mango has become our family's go-to every season.", customerImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=85" },
  { customerName: "Hassan Malik", location: "Karachi, Pakistan", rating: 5, review: "I've ordered from many vendors, but nothing compares to the freshness and presentation. The gift boxes are stunning and the taste is unforgettable.", customerImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=85" },
  { customerName: "Fatima Khan", location: "Islamabad, Pakistan", rating: 5, review: "From order to delivery, everything felt premium. The Sindhri pack was orchard-fresh and exactly as described.", customerImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=85" },
];

export const FAQ_ITEMS = [
  { category: "Shipping", question: "Do you deliver nationwide?", answer: "Yes, we deliver across Pakistan with orchard-fresh packaging. International shipping is available on select orders.", sortOrder: 0 },
  { category: "Shipping", question: "How long does delivery take?", answer: "Most orders arrive within 1–3 business days depending on your city.", sortOrder: 1 },
  { category: "Returns", question: "What if my mangoes arrive damaged?", answer: "Contact us within 24 hours with photos and we will arrange a replacement or refund.", sortOrder: 2 },
  { category: "Products", question: "Are your mangoes export quality?", answer: "Yes, every mango is hand-selected and graded for export quality from Multan and Sindh orchards.", sortOrder: 3 },
];

export const BLOG_POSTS = [
  {
    title: "Chaunsa King Of Fruits",
    slug: "chaunsa-king-of-fruits",
    excerpt:
      "Chaunsa mango is widely regarded as the king of fruits in Pakistan. Grown in the fertile orchards of Multan, its honey-sweet pulp, rich aroma, and fiber-free texture make it a favourite among mango lovers at home and abroad.",
    content: `<p>Chaunsa mango is widely regarded as the king of fruits in Pakistan. Grown in the fertile orchards of Multan, its honey-sweet pulp, rich aroma, and fiber-free texture make it a favourite among mango lovers at home and abroad.</p>
<p>Each season, E Royal Mango hand-selects only the finest Chaunsa mangoes at peak ripeness, ensuring export-grade quality from orchard to your doorstep. Whether you are ordering for your family, gifting to loved ones, or sourcing for your business, Chaunsa remains the crown jewel of Pakistan's mango harvest.</p>
<p>Experience the royal taste of Multan's legendary orchards — honey-sweet, aromatic, and unforgettable.</p>`,
    featuredImage: "/images/chaunsa-premium-variety.png",
    categoryName: "Uncategorized",
    author: "E Royal Mango",
    authorEmail: "info@eroyalmango.com",
    publishedAt: "2023-06-12T10:00:00.000Z",
  },
  {
    title: "History Of E Royal Mango",
    slug: "history-of-e-royal-mango",
    excerpt:
      "E Royal Mango was founded with a simple mission: to deliver Pakistan's finest mangoes to discerning customers worldwide. From orchard partnerships in Punjab and Sindh to export-grade packing, our heritage is rooted in quality, trust, and royal care.",
    content: `<p>E Royal Mango was founded with a simple mission: to deliver Pakistan's finest mangoes to discerning customers worldwide. From orchard partnerships in Punjab and Sindh to export-grade packing, our heritage is rooted in quality, trust, and royal care.</p>
<p>What began as a passion for Multan's legendary mango belt has grown into a trusted export brand. We work directly with orchard owners, hand-select every fruit at peak ripeness, and pack with the same attention to detail expected by international buyers.</p>
<p>Today, E Royal Mango serves customers across Pakistan and abroad — from luxury gift boxes to wholesale export orders — always with the same promise: orchard-fresh, export-grade, royally packed.</p>`,
    featuredImage: "/images/anwar-ratol-mango.png",
    categoryName: "Uncategorized",
    author: "E Royal Mango",
    authorEmail: "info@eroyalmango.com",
    publishedAt: "2023-06-08T10:00:00.000Z",
  },
];

export const ABOUT_CONTENT = {
  storyTitle: "Our Story",
  storyParagraphs: [
    "E Royal Mango was born in the heart of Multan's legendary mango belt — where generations of growers have perfected the art of cultivating the world's finest mangoes.",
    "We partner directly with trusted orchard owners to hand-select every fruit at peak ripeness, ensuring export-grade quality from tree to table.",
  ],
  heroImage: "/images/chaunsa-premium-variety.png",
  services: [
    { title: "Orchard Direct", description: "Sourced directly from Multan and Sindh orchards with no middlemen." },
    { title: "Export Quality", description: "Every mango graded and packed to international export standards." },
    { title: "Nationwide Delivery", description: "Fast, temperature-aware shipping across Pakistan and abroad." },
    { title: "Royal Presentation", description: "Luxury gift boxes and crates for personal and corporate orders." },
  ],
  exportProcess: { title: "Export Process", points: ["Hand-picked at peak ripeness", "Graded for export quality", "Foam-lined protective packaging", "Temperature-controlled logistics"] },
  packagingProcess: { title: "Packaging Process", points: ["Individual foam netting", "Ventilated export cartons", "Gift box options available", "Custom corporate branding"] },
  features: ["100% Natural", "No Artificial Ripening", "Farm Fresh", "Premium Grade"],
};

export const CONTACT_PAGE_CONTENT = {
  intro: "We'd love to hear from you. Reach out for orders, wholesale inquiries, or any questions about our premium mangoes.",
  address: "Multan, Punjab, Pakistan",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3476.0!2d71.5249!3d30.1575!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDA5JzI3LjAiTiA3McKwMzEnMjkuNiJF!5e0!3m2!1sen!2s!4v1",
};

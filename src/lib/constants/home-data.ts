export const COLOR_FAMILIES = [
  { id: "white", name: "Trắng", nameEn: "White", hex: "#F7F6F2", desc: "Thanh khiết, dịu nhẹ và ngập tràn ánh sáng", descEn: "Pure, gentle and filled with natural light" },
  { id: "grey", name: "Xám & Đen", nameEn: "Grey & Black", hex: "#6E6E6E", desc: "Hiện đại, tối giản và chiều sâu tĩnh lặng", descEn: "Modern, minimalist and quiet depth" },
  { id: "beige", name: "Be & Nâu", nameEn: "Beige & Brown", hex: "#C6BAA9", desc: "Ấm cúng, mộc mạc và thanh lịch tự nhiên", descEn: "Cozy, rustic and natural elegance" },
  { id: "peach", name: "Cam Đào & Cam", nameEn: "Peach & Orange", hex: "#C7A687", desc: "Trẻ trung, tươi mới và ngập tràn năng lượng", descEn: "Youthful, fresh and full of energy" },
  { id: "red", name: "Đỏ & Hồng", nameEn: "Red & Pink", hex: "#976256", desc: "Quyến rũ, ấm áp và tạo điểm nhấn ấn tượng", descEn: "Charming, warm and creating bold accents" },
  { id: "purple", name: "Tím", nameEn: "Purple", hex: "#9896A0", desc: "Mơ mộng, huyền bí và đầy chất nghệ thuật", descEn: "Dreamy, mysterious and artistic" },
  { id: "blue", name: "Xanh Dương", nameEn: "Blue", hex: "#B4C3CD", desc: "Yên bình, thư thái và phóng khoáng bao la", descEn: "Peaceful, relaxing and vast freedom" },
  { id: "green", name: "Xanh Lá", nameEn: "Green", hex: "#7E9D73", desc: "Gần gũi thiên nhiên, mát lành và thư thái", descEn: "Nature-inspired, fresh and relaxing" },
  { id: "yellow", name: "Vàng", nameEn: "Yellow", hex: "#F2E2A6", desc: "Năng động, ấm áp và khơi nguồn sáng tạo", descEn: "Dynamic, warm and inspiring creativity" }
];

export const COLOR_SWATCHES = [
  { code: "0001", name: "Imagine", nameEn: "Imagine", hex: "#D6E3DB", family: "white" },
  { code: "1001", name: "Trắng Ngà", nameEn: "Ivory White", hex: "#F5F0E8", family: "white" },
  { code: "1002", name: "Trắng Sữa", nameEn: "Milk White", hex: "#FFF8F0", family: "white" },
  { code: "7543", name: "Dusty Green", nameEn: "Dusty Green", hex: "#94A396", family: "green" },
  { code: "7686", name: "Mindful Green", nameEn: "Mindful Green", hex: "#778579", family: "green" },
  { code: "8002", name: "Xanh Rêu", nameEn: "Moss Green", hex: "#5C6B5E", family: "green" },
  { code: "2001", name: "Kem Vani", nameEn: "Vanilla Cream", hex: "#F3E5D0", family: "beige" },
  { code: "2002", name: "Be Cát", nameEn: "Desert Sand", hex: "#D4C4A8", family: "beige" },
  { code: "3004", name: "Xám Sương Mù", nameEn: "Mist Grey", hex: "#E2E5E6", family: "grey" },
  { code: "3003", name: "Xám Than", nameEn: "Charcoal Grey", hex: "#4A4A4A", family: "grey" },
  { code: "7002", name: "Xanh Chiều", nameEn: "Afternoon Blue", hex: "#AEC6CF", family: "blue" },
  { code: "7003", name: "Xanh Teal", nameEn: "Teal Blue", hex: "#008080", family: "blue" },
  { code: "5002", name: "Cam Đất Ấm", nameEn: "Terracotta", hex: "#CC7722", family: "peach" },
  { code: "4002", name: "Vàng Nắng", nameEn: "Sunny Gold", hex: "#FFD93D", family: "yellow" },
  { code: "6002", name: "Đỏ Gạch", nameEn: "Brick Red", hex: "#CB4154", family: "red" },
  { code: "6005", name: "Tím Oải Hương", nameEn: "Lavender", hex: "#D1C4E9", family: "purple" }
];

export const VISUALIZER_ROOMS = [
  {
    id: "living",
    name: "Phòng Khách",
    nameEn: "Living Room",
    image: "/product_interior.webp",
    hotspots: [
      { id: "wallMain", top: "25%", left: "67%", label: "Tường chính", labelEn: "Main Wall" },
      { id: "wallMain", top: "47%", left: "57%", label: "Cột tường", labelEn: "Wall Column" },
      { id: "wallAccent", top: "63%", left: "65%", label: "Tường nhấn", labelEn: "Accent Wall" }
    ],
    wallPolygon: "polygon(0 0, 45% 0, 45% 100%, 0 100%)",
    accentPolygon: "polygon(45% 0, 100% 0, 100% 100%, 45% 100%)",
  },
  {
    id: "bedroom",
    name: "Phòng Ngủ",
    nameEn: "Bedroom",
    image: "/product_interior.webp",
    hotspots: [
      { id: "wallMain", top: "50%", left: "35%", label: "Tường chính", labelEn: "Main Wall" },
      { id: "wallAccent", top: "40%", left: "80%", label: "Tường nhấn", labelEn: "Accent Wall" }
    ],
    wallPolygon: "polygon(0 0, 55% 0, 55% 100%, 0 100%)",
    accentPolygon: "polygon(55% 0, 100% 0, 100% 100%, 55% 100%)",
  },
  {
    id: "facade",
    name: "Mặt Tiền Nhà",
    nameEn: "House Facade",
    image: "/product_interior.webp",
    hotspots: [
      { id: "wallMain", top: "55%", left: "30%", label: "Cột & Tường chính", labelEn: "Main Column & Wall" },
      { id: "wallAccent", top: "48%", left: "65%", label: "Mảng tường nhấn", labelEn: "Accent Wall Panel" }
    ],
    wallPolygon: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
    accentPolygon: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)",
  }
];

export const PRODUCT_CATEGORIES = [
  { id: "cat-1", name: "Sơn Nội Thất", nameEn: "Interior Paint", desc: "Màng sơn láng mịn, lau chùi tối đa, an toàn sức khỏe.", descEn: "Smooth finish, maximum washability, and health-safe.", slug: "son-noi-that", image: "/product_interior.webp" },
  { id: "cat-2", name: "Sơn Ngoại Thất", nameEn: "Exterior Paint", desc: "Chống kiềm hóa, cản nắng làm mát, chống rêu mốc tối đa.", descEn: "Alkali-resistant, sun-reflecting, and maximum mold protection.", slug: "son-ngoai-that", image: "/product_interior.webp" },
  { id: "cat-3", name: "Sơn Chống Thấm", nameEn: "Waterproofing", desc: "Màng bảo vệ đàn hồi co giãn chặn đứng dòng nước ẩm mốc.", descEn: "Elastomeric shield to block moisture and water damage.", slug: "son-chong-tham", image: "/product_interior.webp" },
  { id: "cat-4", name: "Sơn Lót Kháng Kiềm", nameEn: "Alkali Primers", desc: "Tăng cường độ bám và bảo vệ độ phẳng bóng mượt của màu phủ.", descEn: "Enhances adhesion and protects topcoat smoothness.", slug: "son-lot", image: "/product_interior.webp" },
];

export const FEATURED_PRODUCTS = [
  {
    id: "paint-1",
    name: "Majestic Đẹp Hoàn Hảo (Bóng)",
    nameEn: "Majestic Perfect Beauty (Gloss)",
    price: 950000,
    rating: 5,
    tag: "bestseller",
    vol: "5L",
    desc: "Màu sắc rực rỡ sắc nét, dễ lau chùi vượt trội.",
    descEn: "Vibrant colors, sharp definition, and outstanding easy clean.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  },
  {
    id: "paint-3",
    name: "Dulux Ambiance 5 in 1 Siêu Bóng",
    nameEn: "Dulux Ambiance 5 in 1 Super Gloss",
    price: 1100000,
    rating: 5,
    tag: "bestseller",
    vol: "5L",
    desc: "Bề mặt siêu láng mịn và những gam màu sắc nét độc đáo.",
    descEn: "Super smooth surface and unique sharp colors.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#F5F0E8", "#AEC6CF"]
  },
  {
    id: "paint-5",
    name: "Sơn Nội Thất Siêu Cấp TOA SuperShield",
    nameEn: "TOA SuperShield Ultra Premium Interior",
    price: 750000,
    rating: 5,
    tag: "bestseller",
    vol: "5L",
    desc: "Công nghệ tự làm sạch tiên tiến chống bám bẩn vượt trội.",
    descEn: "Self-cleaning technology for superior dirt resistance.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  },
  {
    id: "paint-7",
    name: "Jotashield Bền Màu Tối Ưu",
    nameEn: "Jotashield Extreme Color Protection",
    price: 1350000,
    rating: 5,
    tag: "new",
    vol: "5L",
    desc: "Bảo vệ 12 năm bất chấp khí hậu khắc nghiệt vùng nhiệt đới.",
    descEn: "12-year protection against harsh tropical climates.",
    image: "/product_interior.webp",
    colors: ["#E2E5E6", "#4A6741", "#6F4E37"]
  },
  {
    id: "paint-9",
    name: "Nippon WeatherGard Siêu Bóng",
    nameEn: "Nippon WeatherGard Super Gloss",
    price: 1180000,
    rating: 5,
    tag: "new",
    vol: "5L",
    desc: "Bảo vệ kết cấu bê tông tuyệt vời trước mưa bão và ô nhiễm.",
    descEn: "Protects concrete walls from heavy rain and pollution.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#F5F0E8", "#C0C0C0"]
  },
  {
    id: "paint-11",
    name: "Kansai Alushield Chống Phai Màu",
    nameEn: "Kansai Alushield Extreme Weather",
    price: 1050000,
    rating: 5,
    tag: "new",
    vol: "5L",
    desc: "Sơn ngoại thất siêu cấp, kháng tia cực tím tối ưu.",
    descEn: "Premium exterior paint, preventing UV damage.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  },
  {
    id: "paint-8",
    name: "Dulux Weathershield Bóng",
    nameEn: "Dulux Weathershield Gloss",
    price: 1280000,
    rating: 4,
    tag: "promo",
    vol: "5L",
    desc: "Công nghệ Active Guard chống phai màu, làm mát nhà.",
    descEn: "Active Guard fade resistance, cooling house technology.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#FFF8F0", "#AEC6CF"]
  },
  {
    id: "paint-4",
    name: "Nippon Odour-less Chùi Rửa Vượt Trội",
    nameEn: "Nippon Odour-less Premium Washable",
    price: 850000,
    rating: 4,
    tag: "promo",
    vol: "5L",
    desc: "Không mùi, hàm lượng VOC rất thấp, thân thiện môi trường.",
    descEn: "Odorless, low VOC, eco-friendly and safe for health.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#F5F0E8", "#AEC6CF"]
  },
  {
    id: "paint-10",
    name: "TOA NanoShield Bóng",
    nameEn: "TOA NanoShield Gloss Exterior",
    price: 990000,
    rating: 4,
    tag: "promo",
    vol: "5L",
    desc: "Chống thấm nước vượt trội và chống bám bẩn tự động.",
    descEn: "Extreme water resistance and self-cleaning.",
    image: "/product_interior.webp",
    colors: ["#FFFFFF", "#F5F0E8", "#D4C4A8"]
  }
];

export const FAMILY_METADATA: Record<string, {
  styleVi: string;
  styleEn: string;
  roomsVi: string[];
  roomsEn: string[];
}> = {
  white: {
    styleVi: "Hiện đại Tối giản / Scandinavian",
    styleEn: "Minimalist Modern / Scandinavian",
    roomsVi: ["Phòng Khách", "Phòng Ngủ", "Phòng Bếp", "Phòng Tắm"],
    roomsEn: ["Living Room", "Bedroom", "Kitchen", "Bathroom"]
  },
  grey: {
    styleVi: "Công nghiệp / Hiện đại Đương đại",
    styleEn: "Industrial / Contemporary Modern",
    roomsVi: ["Phòng Khách", "Phòng Làm Việc", "Hành Lang"],
    roomsEn: ["Living Room", "Study Room", "Hallway"]
  },
  beige: {
    styleVi: "Ấm áp Mộc mạc / Japandi",
    styleEn: "Cozy Rustic / Japandi",
    roomsVi: ["Phòng Ngủ", "Phòng Khách", "Phòng Ăn"],
    roomsEn: ["Bedroom", "Living Room", "Dining Room"]
  },
  peach: {
    styleVi: "Hiện đại Giữa thế kỷ / Phóng khoáng",
    styleEn: "Mid-Century Modern / Eclectic",
    roomsVi: ["Phòng Trẻ Em", "Phòng Sáng Tạo", "Phòng Ăn"],
    roomsEn: ["Kids Room", "Creative Studio", "Dining Room"]
  },
  red: {
    styleVi: "Cổ điển Sang trọng / Tạo Điểm Nhấn",
    styleEn: "Traditional Elegant / Bold Accent",
    roomsVi: ["Tường Nhấn", "Phòng Ăn", "Lối Vào"],
    roomsEn: ["Accent Wall", "Dining Room", "Entryway"]
  },
  purple: {
    styleVi: "Nghệ thuật Mơ mộng / Lãng mạn",
    styleEn: "Artistic Dreamy / Romantic",
    roomsVi: ["Phòng Ngủ Chính", "Phòng Spa", "Phòng Đọc Sách"],
    roomsEn: ["Master Bedroom", "Spa Room", "Reading Room"]
  },
  blue: {
    styleVi: "Ven biển / Tĩnh lặng Tự nhiên",
    styleEn: "Coastal / Serene Natural",
    roomsVi: ["Phòng Ngủ", "Phòng Tắm", "Phòng Học"],
    roomsEn: ["Bedroom", "Bathroom", "Study Room"]
  },
  green: {
    styleVi: "Thiên nhiên / Hữu cơ Sinh thái",
    styleEn: "Biophilic / Organic Natural",
    roomsVi: ["Phòng Khách", "Góc Đọc Sách", "Phòng Ngủ"],
    roomsEn: ["Living Room", "Reading Nook", "Bedroom"]
  },
  yellow: {
    styleVi: "Vui tươi / Nông thôn Mộc mạc",
    styleEn: "Cheerful / Sunny Rustic",
    roomsVi: ["Phòng Bếp", "Phòng Ăn", "Phòng Vui Chơi"],
    roomsEn: ["Kitchen", "Dining Area", "Playroom"]
  }
};

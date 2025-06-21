const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://redberry-inventory-client.vercel.app",
  "https://redberry-inventory-production.up.railway.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    const isAllowed =
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/redberry-inventory-client-[\w-]+(--)?shaiel2212s-projects\.vercel\.app$/.test(origin);

    if (isAllowed) {
      console.log("✅ Origin allowed:", origin);
      callback(null, true);
    } else {
      console.log("❌ Origin blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
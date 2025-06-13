const allowedOrigins = [
  "http://localhost:3000",
  "https://redberry-inventory-client.vercel.app",
  "https://redberry-inventory-production.up.railway.app",
  // תוסיף פה עוד דומיינים לפי הצורך
];

const corsOptions = {
  origin: function (origin, callback) {
    const isAllowed =
      !origin ||
      origin === "http://localhost:3000/login" ||
      origin === "https://redberry-inventory-client.vercel.app" ||
      /^https:\/\/redberry-inventory-client-[\w-]+(-{1,2})shaiel2212s-projects\.vercel\.app$/.test(
        origin
      ) ||
      origin === "https://redberry-inventory-production.up.railway.app";

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

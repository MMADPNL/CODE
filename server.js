const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;
const DAILY_LIMIT = 400;

app.use(cors());
app.use(express.json());

let usedToday = 0;
let lastReset = new Date().toISOString().slice(0, 10);
const history = [];

function resetQuota() {
  const today = new Date().toISOString().slice(0, 10);

  if (today !== lastReset) {
    usedToday = 0;
    lastReset = today;
  }
}

// وضعیت سرور
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "CODE Mobile Recharge PIN API",
    status: "online"
  });
});

// سهمیه
app.get("/api/quota", (req, res) => {
  resetQuota();

  res.json({
    success: true,
    limit: DAILY_LIMIT,
    used: usedToday,
    remaining: DAILY_LIMIT - usedToday
  });
});

// دریافت کد شارژ
app.post("/api/recharge/request", async (req, res) => {
  resetQuota();

  if (usedToday >= DAILY_LIMIT) {
    return res.status(429).json({
      success: false,
      message: "سهمیه روزانه ۴۰۰ کد تمام شده است."
    });
  }

  const { operator, amount } = req.body;

  const allowedOperators = [
    "mci",
    "irancell",
    "rightel"
  ];

  const allowedAmounts = [
    10000,
    20000,
    50000,
    100000,
    200000
  ];

  if (!allowedOperators.includes(operator)) {
    return res.status(400).json({
      success: false,
      message: "اپراتور نامعتبر است."
    });
  }

  if (!allowedAmounts.includes(Number(amount))) {
    return res.status(400).json({
      success: false,
      message: "مبلغ شارژ نامعتبر است."
    });
  }

  /*
    این قسمت باید به API واقعی تأمین‌کننده وصل شود.

    مثال ساختاری:

    const voucher = await buyFromProvider({
      operator,
      amount
    });

    اگر خرید موفق بود:
      usedToday++;

    فعلاً عمداً کد ساختگی تولید نمی‌کنیم.
  */

  return res.status(503).json({
    success: false,
    message: "API تأمین‌کننده شارژ هنوز متصل نشده است."
  });
});

// تاریخچه
app.get("/api/history", (req, res) => {
  res.json({
    success: true,
    history
  });
});

// ثبت مصرف کد
app.post("/api/recharge/used", (req, res) => {
  const { id } = req.body;

  const item = history.find(x => x.id === id);

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "کد پیدا نشد."
    });
  }

  item.used = true;

  res.json({
    success: true
  });
});

app.listen(PORT, () => {
  console.log(`CODE API running on port ${PORT}`);
});

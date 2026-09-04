const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/*
====================================================
تنظیمات
====================================================
*/

const DAILY_LIMIT = 400;

/*
در پروژه واقعی این اطلاعات باید در Database باشند.

برای شروع، حافظه موقت استفاده شده.
بعداً SQLite/PostgreSQL/Redis اضافه می‌کنیم.
*/

const requests = [];

let dailyCounter = {
    date: getDate(),
    used: 0
};


/*
====================================================
تاریخ
====================================================
*/

function getDate(){

    return new Date()
        .toISOString()
        .slice(0,10);

}


function resetQuotaIfNeeded(){

    const today = getDate();

    if(dailyCounter.date !== today){

        dailyCounter = {
            date:today,
            used:0
        };

    }

}


/*
====================================================
API وضعیت سهمیه
====================================================
*/

app.get(
    "/api/quota",
    (req,res)=>{

        resetQuotaIfNeeded();

        res.json({

            success:true,

            limit:DAILY_LIMIT,

            used:dailyCounter.used,

            remaining:
                DAILY_LIMIT -
                dailyCounter.used

        });

    }
);


/*
====================================================
درخواست ووچر
====================================================
*/

app.post(
    "/api/voucher/request",
    async (req,res)=>{

        resetQuotaIfNeeded();

        if(dailyCounter.used >= DAILY_LIMIT){

            return res.status(429).json({

                success:false,

                message:
                    "سهمیه روزانه ۴۰۰ درخواست تمام شده است."

            });

        }


        const {
            type,
            amount
        } = req.body;


        if(type !== "hot-voucher"){

            return res.status(400).json({

                success:false,

                message:
                    "نوع ووچر نامعتبر است."

            });

        }


        if(
            !amount ||
            Number(amount) <= 0
        ){

            return res.status(400).json({

                success:false,

                message:
                    "مبلغ نامعتبر است."

            });

        }


        /*
        ==============================================
        اینجا باید API واقعی تأمین‌کننده فراخوانی شود.
        ==============================================

        const providerResult =
            await buyFromProvider({
                type,
                amount
            });

        if(!providerResult.success){

            return res.status(502).json({
                success:false,
                message:"تأمین‌کننده پاسخ موفق نداد."
            });

        }

        const realCode =
            providerResult.code;

        ==============================================
        */

        return res.status(503).json({

            success:false,

            message:
                "API تأمین‌کننده هنوز متصل نشده است. برای دریافت ووچر واقعی باید Provider API رسمی اضافه شود."

        });

    }
);


/*
====================================================
ثبت مصرف‌شده
====================================================
*/

app.post(
    "/api/voucher/used",
    (req,res)=>{

        const { id } = req.body;

        const item =
            requests.find(x => x.id === id);

        if(!item){

            return res.status(404).json({

                success:false,

                message:"ووچر پیدا نشد."

            });

        }

        if(item.status === "used"){

            return res.status(409).json({

                success:false,

                message:
                    "این ووچر قبلاً مصرف‌شده ثبت شده است."

            });

        }

        item.status = "used";

        item.usedAt =
            new Date().toISOString();

        res.json({
            success:true
        });

    }
);


/*
====================================================
سوابق
====================================================
*/

app.get(
    "/api/history",
    (req,res)=>{

        res.json({

            success:true,

            items:
                requests.map(x => ({

                    id:x.id,

                    type:x.type,

                    amount:x.amount,

                    status:x.status,

                    createdAt:x.createdAt,

                    usedAt:x.usedAt || null

                }))

        });

    }
);


/*
====================================================
خرید از Provider
====================================================

بعد از دریافت مستندات API واقعی، این تابع را
تکمیل می‌کنیم.

API Key هرگز نباید داخل index.html قرار بگیرد.

مثلاً:

process.env.PROVIDER_API_KEY
process.env.PROVIDER_API_URL

====================================================
*/

async function buyFromProvider(data){

    throw new Error(
        "Provider API is not configured."
    );

}


/*
====================================================
سرور
====================================================
*/

app.listen(
    PORT,
    ()=>{
        console.log(
            `CODE backend running on port ${PORT}`
        );
    }
);

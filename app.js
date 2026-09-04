/*
آدرس Backend را بعد از Deploy اینجا قرار بده.

مثال:
https://YOUR-BACKEND.example.com
*/

const API_BASE = "https://mmadpnl.github.io/CODE/?utm_source=chatgpt.com;

let currentVoucher = null;

function setStatus(text,error=false){

    const box = document.getElementById("status");

    box.style.display = "block";
    box.textContent = text;

    box.style.color = error
        ? "#ff9ca8"
        : "#8ce5b2";
}


async function requestVoucher(){

    const type =
        document.getElementById("voucherType").value;

    const amount =
        document.getElementById("amount").value;

    const button =
        document.getElementById("requestButton");

    if(!type){

        setStatus(
            "نوع ووچر را انتخاب کن.",
            true
        );

        return;
    }

    if(!amount || Number(amount) <= 0){

        setStatus(
            "مبلغ معتبر وارد کن.",
            true
        );

        return;
    }

    button.disabled = true;

    setStatus("در حال ارسال درخواست...");

    document.getElementById("result")
        .style.display = "none";

    try{

        const response = await fetch(
            API_BASE + "/api/voucher/request",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    type:type,
                    amount:Number(amount)
                })
            }
        );

        const data = await response.json();

        if(!response.ok || !data.success){

            throw new Error(
                data.message || "درخواست ناموفق بود."
            );
        }

        currentVoucher = data.voucher;

        document.getElementById("voucherCode")
            .textContent =
            currentVoucher.code;

        document.getElementById("result")
            .style.display = "block";

        setStatus(
            "ووچر با موفقیت دریافت شد."
        );

        updateQuota();

    }catch(error){

        setStatus(
            error.message ||
            "خطا در ارتباط با سرور.",
            true
        );

    }finally{

        button.disabled = false;

    }
}


async function updateQuota(){

    try{

        const response = await fetch(
            API_BASE + "/api/quota"
        );

        const data = await response.json();

        if(data.success){

            document.getElementById("usedCount")
                .textContent =
                Number(data.used).toLocaleString("fa-IR");

        }

    }catch(e){}

}


async function copyVoucher(){

    if(!currentVoucher){
        return;
    }

    try{

        await navigator.clipboard.writeText(
            currentVoucher.code
        );

        setStatus("کد کپی شد.");

    }catch(e){

        setStatus(
            "کپی انجام نشد.",
            true
        );

    }
}


async function markUsed(){

    if(!currentVoucher){
        return;
    }

    if(!confirm(
        "آیا مطمئن هستی این ووچر مصرف شده؟"
    )){
        return;
    }

    try{

        const response = await fetch(
            API_BASE + "/api/voucher/used",
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    id:currentVoucher.id
                })
            }
        );

        const data = await response.json();

        if(!response.ok || !data.success){

            throw new Error(
                data.message ||
                "ثبت مصرف ناموفق بود."
            );
        }

        setStatus(
            "ووچر به عنوان مصرف‌شده ثبت شد."
        );

        document.getElementById("result")
            .style.display = "none";

        currentVoucher = null;

        loadHistory();

    }catch(error){

        setStatus(
            error.message,
            true
        );

    }
}


async function loadHistory(){

    try{

        const response = await fetch(
            API_BASE + "/api/history"
        );

        const data = await response.json();

        const list =
            document.getElementById("historyList");

        list.innerHTML = "";

        if(!data.success ||
           !data.items ||
           data.items.length === 0){

            list.innerHTML =
                "<div>هنوز سابقه‌ای وجود ندارد.</div>";

            return;
        }

        data.items.forEach(item => {

            const div =
                document.createElement("div");

            div.className = "item";

            div.textContent =
                `${item.type} | مبلغ: ${item.amount} | وضعیت: ${item.status}`;

            list.appendChild(div);

        });

    }catch(e){}

}


updateQuota();
loadHistory();

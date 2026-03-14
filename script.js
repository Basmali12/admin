// script.js
const config = window.MY_STORE_CONFIG;

firebase.initializeApp(config.firebase);
const db = firebase.database();
const cloudName = config.cloudinary.cloudName; 
const uploadPreset = config.cloudinary.uploadPreset; 

function checkLogin() {
    const code = document.getElementById('login-input').value;
    if(code === config.security.adminCode) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');
    window.scrollTo(0,0);
}

function showDesignSection(sectionId) {
    document.getElementById('design-menu').style.display = 'none';
    document.getElementById('banner-section').style.display = 'none';
    document.getElementById('category-section').style.display = 'none';
    if(sectionId === 'menu') {
        document.getElementById('design-menu').style.display = 'block';
    } else {
        document.getElementById(sectionId).style.display = 'block';
    }
}

db.ref('orders').on('value', (snapshot) => {
    const list = document.getElementById('orders-list');
    list.innerHTML = "";
    const data = snapshot.val();
    if(!data) { list.innerHTML = "<p style='text-align:center; padding:20px;'>لا توجد طلبات جديدة</p>"; return; }
    Object.keys(data).reverse().forEach(key => {
        const o = data[key];
        const date = new Date(o.timestamp).toLocaleString('ar-EG');
        let itemsHtml = "";
        if(o.items) { o.items.forEach(i => itemsHtml += `<li>${i.title}</li>`); }
        list.innerHTML += `
        <div class="order-item">
            <div class="order-header"><span>👤 ${o.customerName}</span><span style="font-size:12px; color:#999;">${date}</span></div>
            <div class="order-details"><p>📞 <a href="tel:${o.phone}" style="color:#ff9900; text-decoration:none;">${o.phone}</a></p><p>📍 ${o.address}</p><p style="margin-top:5px; font-weight:bold;">🛒 المنتجات:</p><ul style="margin:5px 20px 10px;">${itemsHtml}</ul><p style="font-weight:bold; color:#27ae60; font-size:16px;">💰 المجموع: ${o.total}</p></div>
            <button class="delete-btn" onclick="deleteOrder('${key}')"><i class="fa-solid fa-trash"></i> حذف</button>
            <div style="clear:both;"></div>
        </div>`;
    });
});
function deleteOrder(key) { if(confirm("حذف الطلب؟")) db.ref('orders').child(key).remove(); }

db.ref('banners').on('value', snapshot => {
    const list = document.getElementById('banners-list-container');
    list.innerHTML = "";
    const data = snapshot.val();
    if(data) {
        Object.keys(data).forEach(key => {
            const b = data[key];
            list.innerHTML += `<div class="banner-list-item"><div style="display:flex; align-items:center; gap:10px;"><img src="${b.image}" class="banner-preview"><span style="font-size:12px;">${b.title || 'بدون عنوان'}</span></div><button class="delete-btn" onclick="deleteBanner('${key}')">X</button></div>`;
        });
    } else { list.innerHTML = "<p style='font-size:12px; color:#999; text-align:center;'>لا توجد بنرات حالياً</p>"; }
});
async function uploadBanner() {
    const title = document.getElementById('banner-title').value;
    const fileInput = document.getElementById('banner-img');
    if(fileInput.files.length === 0) return alert("اختر صورة");
    document.getElementById('banner-status').innerText = "جاري الرفع...";
    const imgUrl = await uploadToCloudinary(fileInput.files[0]);
    if(imgUrl) {
        db.ref('banners').push({ title: title, image: imgUrl });
        document.getElementById('banner-status').innerText = "✅ تم";
        document.getElementById('banner-status').style.color = "green";
        fileInput.value = ""; document.getElementById('banner-title').value = "";
    }
}
function deleteBanner(key) { if(confirm("حذف هذا البنر؟")) db.ref('banners').child(key).remove(); }

db.ref('categories').on('value', snapshot => {
    const select = document.getElementById('p-cat-select');
    const listManage = document.getElementById('categories-list-manage');
    select.innerHTML = '<option value="general">عام</option>'; 
    listManage.innerHTML = "";
    const data = snapshot.val();
    if(data) {
        Object.keys(data).forEach(key => {
            const cat = data[key];
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            listManage.innerHTML += `<div class="banner-list-item"><div style="display:flex; align-items:center; gap:10px;"><img src="${cat.image}" class="banner-preview" style="border-radius:50%;"><span style="font-size:12px;">${cat.name}</span></div><button class="delete-btn" onclick="deleteCategory('${key}')">X</button></div>`;
        });
    } else { listManage.innerHTML = "<p style='font-size:12px; color:#999; text-align:center;'>لا توجد تصنيفات</p>"; }
});
async function uploadCategory() {
    const name = document.getElementById('cat-name-new').value;
    const fileInput = document.getElementById('cat-img-new');
    if(!name || fileInput.files.length === 0) return alert("البيانات ناقصة");
    document.getElementById('cat-status').innerText = "جاري...";
    const imgUrl = await uploadToCloudinary(fileInput.files[0]);
    if(imgUrl) {
        const catId = name.replace(/\s+/g, '_'); 
        db.ref('categories').push({ name: name, image: imgUrl, id: catId });
        document.getElementById('cat-status').innerText = "✅ تم";
        fileInput.value = ""; document.getElementById('cat-name-new').value = "";
    }
}
function deleteCategory(key) { if(confirm("حذف هذا التصنيف؟")) db.ref('categories').child(key).remove(); }

db.ref('products').on('value', snapshot => {
    const list = document.getElementById('products-list-manage');
    list.innerHTML = "";
    const data = snapshot.val();
    if(data) {
        Object.keys(data).reverse().forEach(key => {
            const p = data[key];
            list.innerHTML += `<div class="banner-list-item"><div style="display:flex; align-items:center; gap:10px;"><img src="${p.image}" class="banner-preview"><div style="font-size:12px;"><div>${p.title}</div><div style="color:#27ae60; font-weight:bold;">${p.price}</div></div></div><button class="delete-btn" onclick="deleteProduct('${key}')">X</button></div>`;
        });
    } else { list.innerHTML = "<p style='font-size:12px; color:#999; text-align:center;'>لا توجد منتجات</p>"; }
});
async function uploadProduct() {
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const desc = document.getElementById('p-desc').value;
    const cat = document.getElementById('p-cat-select').value;
    const fileInput = document.getElementById('p-img');
    if(!name || !price || fileInput.files.length === 0) return alert("البيانات ناقصة");
    document.getElementById('prod-status').innerText = "جاري الرفع...";
    const imgUrl = await uploadToCloudinary(fileInput.files[0]);
    if(imgUrl) {
        await db.ref('products').push({ title: name, price: Number(price), description: desc, category: cat, image: imgUrl, date: firebase.database.ServerValue.TIMESTAMP });
        document.getElementById('prod-status').innerText = "✅ تم النشر";
        document.getElementById('p-name').value = ""; document.getElementById('p-price').value = "";
        document.getElementById('p-desc').value = ""; document.getElementById('p-img').value = "";
    }
}
function deleteProduct(key) { if(confirm("حذف هذا المنتج؟")) db.ref('products').child(key).remove(); }

function saveSettings() {
    const name = document.getElementById('store-name-input').value;
    const phone = document.getElementById('whatsapp-input').value;
    if(!name || !phone) return alert("أكمل البيانات");
    db.ref('settings').update({ storeName: name, whatsapp: phone }).then(() => {
        document.getElementById('settings-status').innerText = "✅ تم الحفظ";
        document.getElementById('settings-status').style.color = "green";
    });
}
db.ref('settings').on('value', snapshot => {
    const s = snapshot.val();
    if(s) {
        if(s.storeName) document.getElementById('store-name-input').value = s.storeName;
        if(s.whatsapp) document.getElementById('whatsapp-input').value = s.whatsapp;
    }
});

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
        const data = await res.json();
        return data.secure_url;
    } catch(e) { alert("فشل الرفع"); return null; }
}

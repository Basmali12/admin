// script.js
const config = window.MY_STORE_CONFIG;

firebase.initializeApp(config.firebase);
const db = firebase.database();

function checkLogin() {
    const code = document.getElementById('login-input').value.toString().trim();
    if(code === config.security.adminCode.toString().trim()) {
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

function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;
                const maxWidth = 1080;
                const maxHeight = 1080;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                resolve(dataUrl);
            };
        };
        reader.readAsDataURL(file);
    });
}

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
    
    const imgUrl = await compressImage(fileInput.files[0]);
    
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
    
    const imgUrl = await compressImage(fileInput.files[0]);
    
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
            list.innerHTML += `<div class="banner-list-item"><div style="display:flex; align-items:center; gap:10px;"><img src="${p.image}" class="banner-preview"><div style="font-size:12px;"><div>${p.title}</div></div></div><button class="delete-btn" onclick="deleteProduct('${key}')">X</button></div>`;
        });
    } else { list.innerHTML = "<p style='font-size:12px; color:#999; text-align:center;'>لا توجد منتجات</p>"; }
});

window.addDynamicButton = function() {
    const container = document.getElementById('dynamic-buttons-container');
    const div = document.createElement('div');
    div.style.display = 'flex'; div.style.gap = '5px'; div.style.marginBottom = '5px';
    div.innerHTML = `<input type="text" class="btn-name" placeholder="تسمية الزر"><input type="url" class="btn-url" placeholder="رابط الدخول"><button class="delete-btn" onclick="this.parentElement.remove()" style="margin:8px 0;">X</button>`;
    container.appendChild(div);
}

async function uploadProduct() {
    const fileInput = document.getElementById('p-img');
    const name = document.getElementById('p-name').value;
    const desc = document.getElementById('p-desc').value;
    const cat = document.getElementById('p-cat-select').value;
    
    if(fileInput.files.length === 0 || !name) return alert("البيانات ناقصة");
    document.getElementById('prod-status').innerText = "جاري الرفع...";
    
    const btns = [];
    document.querySelectorAll('#dynamic-buttons-container > div').forEach(div => {
        const bName = div.querySelector('.btn-name').value;
        const bUrl = div.querySelector('.btn-url').value;
        if(bName && bUrl) btns.push({ name: bName, url: bUrl });
    });

    const imgUrl = await compressImage(fileInput.files[0]);
    
    if(imgUrl) {
        await db.ref('products').push({ image: imgUrl, title: name, description: desc, category: cat, buttons: btns, date: firebase.database.ServerValue.TIMESTAMP });
        document.getElementById('prod-status').innerText = "✅ تم النشر";
        document.getElementById('p-name').value = ""; document.getElementById('p-desc').value = ""; document.getElementById('p-img').value = "";
        document.getElementById('dynamic-buttons-container').innerHTML = "";
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

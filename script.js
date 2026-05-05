// 1. معاينة الصورة عند اختيارها من الجهاز
document.getElementById('productImage').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file); // قراءة الملف لعرضه فقط، ولن يتم حفظه كـ Base64
    }
});

// 2. دالة لضغط الصورة باستخدام Canvas لتقليل حجمها قبل الرفع
async function compressImage(file, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // الحفاظ على أبعاد الصورة الأصلية
                canvas.width = img.width;
                canvas.height = img.height;
                
                // رسم الصورة على الكانفاس
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // تحويل الكانفاس إلى ملف (Blob) مضغوط بالجودة المطلوبة
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
            };
            img.onerror = (err) => reject(err);
        };
    });
}

// 3. دالة لرفع الصورة المضغوطة إلى ImgBB
async function uploadToImgBB(imageBlob) {
    const formData = new FormData();
    formData.append('image', imageBlob, 'product.jpg');

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            // استخراج رابط الصورة ورابط الحذف
            return { url: data.data.url, deleteUrl: data.data.delete_url };
        } else {
            throw new Error('فشل الرفع إلى الخادم');
        }
    } catch (error) {
        console.error("خطأ أثناء الرفع:", error);
        alert("حدث خطأ أثناء رفع الصورة.");
        return null;
    }
}

// 4. تنفيذ العملية عند الضغط على زر الحفظ
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerText = "جاري الضغط والرفع...";
    btn.disabled = true;

    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const file = document.getElementById('productImage').files[0];

    try {
        // الخطوة أ: ضغط الصورة
        const compressedBlob = await compressImage(file, 0.7);
        
        // الخطوة ب: الرفع إلى ImgBB
        const imgData = await uploadToImgBB(compressedBlob);
        
        if (imgData) {
            // الخطوة ج: تخزين الروابط والبيانات في Firestore
            await db.collection(CONFIG.COLLECTION_NAME).add({
                name: name,
                price: price,
                imageUrl: imgData.url,
                deleteUrl: imgData.deleteUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert("تم حفظ المنتج بنجاح!");
            // تفريغ النموذج وإخفاء المعاينة
            document.getElementById('productForm').reset();
            document.getElementById('imagePreview').style.display = 'none';
        }
    } catch (error) {
        console.error("خطأ:", error);
    } finally {
        btn.innerText = "رفع وحفظ المنتج";
        btn.disabled = false;
    }
});

// 5. جلب وعرض المنتجات في لوحة الإدارة
function loadAdminProducts() {
    const list = document.getElementById('adminProductsList');
    
    // استخدام onSnapshot لجلب البيانات وتحديثها فورياً
    db.collection(CONFIG.COLLECTION_NAME).orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            list.innerHTML += `
                <div class="admin-card">
                    <img src="${data.imageUrl}" alt="${data.name}">
                    <div class="info">
                        <h3>${data.name}</h3>
                        <p>${data.price} د.ع</p>
                        <button onclick="deleteProduct('${doc.id}', '${data.deleteUrl}')" class="delete-btn">حذف المنتج</button>
                    </div>
                </div>
            `;
        });
    });
}

// 6. دالة الحذف
async function deleteProduct(docId, deleteUrl) {
    if(!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;

    try {
        // محاولة حذف الصورة من موقع ImgBB أولاً
        if (deleteUrl) {
            try { 
                await fetch(deleteUrl, { mode: 'no-cors' }); 
            } catch(e) {
                console.log("تجاوز خطأ CORS لحذف الصورة.");
            }
        }
        
        // حذف البيانات من قاعدة بيانات Firebase
        await db.collection(CONFIG.COLLECTION_NAME).doc(docId).delete();
        alert("تم الحذف بنجاح");
    } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
    }
}

// تشغيل جلب المنتجات عند تحميل الصفحة
window.onload = loadAdminProducts;

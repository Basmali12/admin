document.getElementById('productImage').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

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
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
            };
            img.onerror = reject;
        };
    });
}

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
            return { url: data.data.url, deleteUrl: data.data.delete_url };
        } else {
            throw new Error('فشل الرفع');
        }
    } catch (error) {
        console.error(error);
        alert("خطأ في رفع الصورة.");
        return null;
    }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerText = "جاري المعالجة...";
    btn.disabled = true;

    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const file = document.getElementById('productImage').files[0];

    try {
        const compressedBlob = await compressImage(file, 0.7);
        const imgData = await uploadToImgBB(compressedBlob);
        
        if (imgData) {
            await db.collection(CONFIG.COLLECTION_NAME).add({
                name: name,
                price: price,
                imageUrl: imgData.url,
                deleteUrl: imgData.deleteUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("تم الحفظ بنجاح!");
            document.getElementById('productForm').reset();
            document.getElementById('imagePreview').style.display = 'none';
        }
    } catch (error) {
        console.error(error);
    } finally {
        btn.innerText = "حفظ المنتج";
        btn.disabled = false;
    }
});

function loadAdminProducts() {
    const list = document.getElementById('productsList');
    db.collection(CONFIG.COLLECTION_NAME).orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        list.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            list.innerHTML += `
                <div style="border-bottom: 1px solid #ccc; padding: 10px; display: flex; gap: 10px; align-items: center;">
                    <img src="${data.imageUrl}" width="60" style="border-radius: 5px;">
                    <div>
                        <h3>${data.name}</h3>
                        <p>${data.price} د.ع</p>
                        <button onclick="deleteProduct('${doc.id}', '${data.deleteUrl}')" style="background: red; color: white;">حذف</button>
                    </div>
                </div>
            `;
        });
    });
}

async function deleteProduct(docId, deleteUrl) {
    if(!confirm("تأكيد الحذف؟")) return;
    try {
        if (deleteUrl) {
            try { await fetch(deleteUrl, { mode: 'no-cors' }); } catch(e) {}
        }
        await db.collection(CONFIG.COLLECTION_NAME).doc(docId).delete();
    } catch (error) {
        console.error(error);
    }
}
window.onload = loadAdminProducts;

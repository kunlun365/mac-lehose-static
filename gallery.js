const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const items = [...document.querySelectorAll('.gallery-item')];
let currentIndex = 0;
let touchStartX = 0;
let touchStartY = 0;
let multiTouch = false;   // 本次是否多指手势（双指缩放）
let lastPinchTime = 0;

document.getElementById('photo-count').textContent = `共${items.length}张图片`;

// 打开大图时记录是第几张
items.forEach((item, index) => {
    item.addEventListener('click', e => {
        e.stopPropagation();
        currentIndex = index;
        lightboxImg.src = item.dataset.img;
        lightbox.classList.add('show');
        history.pushState({ lightbox: true }, '');
    });
});

// 关闭大图
function closeLightbox() {
    if (!lightbox.classList.contains('show')) return;   // 幂等保护，已经关了，不再退历史
    lightbox.classList.remove('show');
    history.back();
}

// 拦截浏览器返回手势：只关大图，不退回上一页
window.addEventListener('popstate', () => {
    if (lightbox.classList.contains('show')) {
        lightbox.classList.remove('show');
    }
});

// 触摸滑动切换
lightbox.addEventListener('touchstart', e => {
    if (e.touches.length > 1) {
        multiTouch = true; // 双指及以上，标记为缩放
        lastPinchTime = Date.now();
        return;
    }
    multiTouch = false;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

lightbox.addEventListener('touchmove', e => {
    if (e.touches.length > 1) lastPinchTime = Date.now();
});

lightbox.addEventListener('touchend', e => {
    if (e.touches.length > 0) return; // 还有手指没抬起
    if (Date.now() - lastPinchTime < 500) return; // 刚缩放完，忽略

    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // 横向位移够大、且明显大于纵向位移 → 判定为滑动
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
            showImage(currentIndex + 1);   // 左滑 → 下一张
        } else {
            showImage(currentIndex - 1);   // 右滑 → 上一张
        }
        return;
    }

    // 只有几乎没移动才算点击 → 关闭
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        closeLightbox();
    }
});

// 鼠标用 click 关闭
if (!('ontouchstart' in window)) {
    lightbox.addEventListener('click', closeLightbox);
}

// 切换图片（带淡入淡出）
function showImage(index) {
    if (index < 0) index = items.length - 1;   // 循环到最后
    if (index >= items.length) index = 0;      // 循环到第一
    currentIndex = index;

    lightboxImg.style.opacity = 0;             // 先淡出
    setTimeout(() => {
        lightboxImg.src = items[currentIndex].dataset.img;
        lightboxImg.style.opacity = 1;         // 换图后淡入
    }, 80);                                   // 和 CSS transition 时长一致
}

// 页面跳转 loading
const pageLoading = document.getElementById('page-loading');

document.querySelector('.back-bar a').addEventListener('click', () => {
    pageLoading.classList.add('show');
});

// 从 bfcache 恢复页面时（浏览器缓存返回）兜底关闭
window.addEventListener('pageshow', () => {
    pageLoading.classList.remove('show');
});
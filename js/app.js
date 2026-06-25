// ===== TELEGRAM WEB APP INIT =====
const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

// Цвета под тему Telegram
tg.setHeaderColor('#0F0F1A');
tg.setBackgroundColor('#0F0F1A');

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
const state = {
    currentScreen: 'screen-home',
    previousScreen: null,
    orderType: null,
    orderPrice: 0,
    orderTitle: '',
    orderIcon: '',
    description: '',
    contact: '',
    urgency: 'standard',
    paymentMethod: 'card',
    orderCounter: 1000
};

// ===== ДАННЫЕ ПРОДУКТОВ =====
const products = {
    basic: {
        title: 'Бот без Mini App',
        icon: '🤖',
        price: 1000,
        screen: 'screen-product-basic'
    },
    miniapp: {
        title: 'Бот с Mini App',
        icon: '🚀',
        price: 2500,
        screen: 'screen-product-miniapp'
    }
};

// ===== LOADER =====
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.classList.add('hidden');

        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 1800);
});

// ===== НАВИГАЦИЯ =====
function navigateTo(screenId) {
    const current = document.querySelector('.screen.active');
    const next = document.getElementById(screenId);

    if (!next || current === next) return;

    state.previousScreen = state.currentScreen;
    state.currentScreen = screenId;

    current.classList.remove('active');
    next.classList.add('active');

    // Скролл наверх
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Показываем / скрываем bottomNav
    const hiddenScreens = ['screen-order', 'screen-payment', 'screen-success'];
    const bottomNav = document.getElementById('bottom-nav');

    if (hiddenScreens.includes(screenId)) {
        bottomNav.style.display = 'none';
        document.body.style.paddingBottom = '20px';
    } else {
        bottomNav.style.display = 'flex';
        document.body.style.paddingBottom = '80px';
    }

    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Навигация с обновлением нижнего меню
function navTo(screenId, navItem) {
    navigateTo(screenId);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    navItem.classList.add('active');
}

// ===== КАТАЛОГ =====
function showComingSoon() {
    showModal(
        '🚧 Раздел в разработке',
        'Этот раздел находится в активной разработке и скоро откроется. Следите за обновлениями в нашем канале!'
    );
}

// ===== ЗАКАЗ =====
function startOrder(type) {
    const product = products[type];
    if (!product) return;

    state.orderType = type;
    state.orderPrice = product.price;
    state.orderTitle = product.title;
    state.orderIcon = product.icon;

    // Заполняем форму
    document.getElementById('order-summary-icon').textContent = product.icon;
    document.getElementById('order-summary-title').textContent = product.title;
    document.getElementById('order-summary-price').textContent = formatPrice(product.price);
    document.getElementById('order-description').value = '';
    document.getElementById('order-contact').value = '';
    document.getElementById('description-counter').textContent = 'Минимум 10 символов';

    // Кнопка назад
    const backBtn = document.getElementById('order-back-btn');
    backBtn.onclick = () => navigateTo(product.screen);

    navigateTo('screen-order');
}

// Счётчик символов
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('order-description');
    if (textarea) {
        textarea.addEventListener('input', () => {
            const len = textarea.value.length;
            const counter = document.getElementById('description-counter');
            if (len < 10) {
                counter.textContent = `Минимум 10 символов (введено ${len})`;
                counter.style.color = '#FF4757';
            } else {
                counter.textContent = `✓ Отлично! Введено ${len} символов`;
                counter.style.color = '#00D084';
            }
        });
    }
});

function submitOrder() {
    const description = document.getElementById('order-description').value.trim();
    const contact = document.getElementById('order-contact').value.trim();
    const urgencyEl = document.querySelector('input[name="urgency"]:checked');

    if (description.length < 10) {
        showToast('⚠️ Опишите проект подробнее (минимум 10 символов)');

        if (tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
        }
        return;
    }

    state.description = description;
    state.contact = contact;
    state.urgency = urgencyEl ? urgencyEl.value : 'standard';

    // Считаем цену с учётом срочности
    let finalPrice = state.orderPrice;
    if (state.urgency === 'urgent') {
        finalPrice = Math.round(finalPrice * 1.5);
    }
    state.finalPrice = finalPrice;

    // Обновляем экран оплаты
    document.getElementById('payment-amount').textContent = formatPrice(finalPrice);

    navigateTo('screen-payment');

    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// ===== ОПЛАТА =====
function selectPayment(element, method) {
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('active');
    });
    element.classList.add('active');
    state.paymentMethod = method;

    // Обновляем реквизиты
    const detailsEl = document.getElementById('payment-details');

    const details = {
        card: `
            <div class="payment-detail-card">
                <span class="payment-detail-label">Номер карты</span>
                <span class="payment-detail-value">1234 5678 9012 3456</span>
            </div>
            <div class="payment-detail-card">
                <span class="payment-detail-label">Получатель</span>
                <span class="payment-detail-value">BitLine Dev</span>
            </div>
        `,
        ymoney: `
            <div class="payment-detail-card">
                <span class="payment-detail-label">ЮMoney кошелёк</span>
                <span class="payment-detail-value">410011234567890</span>
            </div>
        `,
        crypto: `
            <div class="payment-detail-card">
                <span class="payment-detail-label">USDT TRC-20</span>
                <span class="payment-detail-value" style="font-size:11px">TXxx...xxxx</span>
            </div>
            <div class="payment-detail-card">
                <span class="payment-detail-label">BTC</span>
                <span class="payment-detail-value" style="font-size:11px">bc1q...xxxx</span>
            </div>
        `
    };

    detailsEl.innerHTML = details[method] || details.card;

    if (tg.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
}

function confirmPayment() {
    state.orderCounter++;
    const orderNum = `#${state.orderCounter}`;

    document.getElementById('success-order-num').textContent = orderNum;

    // Отправляем данные в бот
    const orderData = {
        order_type: state.orderType,
        order_title: state.orderTitle,
        price: state.finalPrice,
        description: state.description,
        contact: state.contact,
        urgency: state.urgency,
        payment_method: state.paymentMethod,
        order_num: orderNum
    };

    tg.sendData(JSON.stringify(orderData));

    navigateTo('screen-success');

    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// ===== О НАС =====
function showAbout() {
    showModal(
        'ℹ️ О компании BitLine',
        `<strong>BitLine</strong> — команда профессиональных разработчиков.<br><br>
        🚀 Разрабатываем Telegram-боты, сайты и приложения под ключ.<br><br>
        ✅ 150+ проектов<br>
        ✅ 3 года на рынке<br>
        ✅ 98% довольных клиентов<br><br>
        📧 support@bitline.ru<br>
        💬 @BitLineSupport`
    );
}

// ===== МОДАЛЬНОЕ ОКНО =====
function showModal(title, body) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// ===== TOAST =====
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ===== УТИЛИТЫ =====
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

// ===== КНОПКА TELEGRAM =====
tg.MainButton.setText('Связаться с нами');
tg.MainButton.show();
tg.MainButton.onClick(() => {
    tg.openTelegramLink('https://t.me/BitLineOfficial');
});
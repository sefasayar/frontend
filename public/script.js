// script.js

// Supabase bağlantısı
const supabaseUrl = 'https://neijkzbyyqtwpmsvymip.supabase.co'; // Supabase URL'nizi buraya ekleyin
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laWpremJ5eXF0d3Btc3Z5bWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NjY2NjAsImV4cCI6MjA0NjA0MjY2MH0.JiDT3kT_Ror6-AWFKTo9JJBQUC_ZQTPXOYJNpBlaaxQ'; // Supabase Anon Key'inizi buraya ekleyin
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// script.js

// Backend URL'si
const BACKEND_URL = 'https://finansal-analiz-backend.vercel.app';

// Stripe publishable key
const stripe = Stripe('pk_live_51NZXjUGxZtShkwxA6MsCRnBECcoRqRuiUunqNtKn6QT34tIWdxxhTSPx2sMJ16ekSXk2nNdSAfSJEgFYWb1QFOCk002C4jr2y7'); // Stripe Publishable Key'inizi buraya ekleyin

// Supabase Client'ı Başlatma
const supabase = supabase.createClient('https://neijkzbyyqtwpmsvymip.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5laWpremJ5eXF0d3Btc3Z5bWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NjY2NjAsImV4cCI6MjA0NjA0MjY2MH0.JiDT3kT_Ror6-AWFKTo9JJBQUC_ZQTPXOYJNpBlaaxQ');

// Kullanıcı Kayıt Olma Fonksiyonu
async function signUp(email, password) {
    console.log('Kayıt Fonksiyonu Çalıştırılıyor...');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        console.error('Kayıt Hatası:', error.message);
        alert('Kayıt Hatası: ' + error.message);
    } else {
        alert('Kayıt Başarılı! Lütfen e-posta adresinizi doğrulayın.');
    }
}

// Kullanıcı Giriş Yapma Fonksiyonu
async function signIn(email, password) {
    console.log('Giriş Fonksiyonu Çalıştırılıyor...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        console.error('Giriş Hatası:', error.message);
        alert('Giriş Hatası: ' + error.message);
    } else {
        alert('Giriş Başarılı!');
        // Kullanıcı kimliğini localStorage'a kaydetme
        localStorage.setItem('userId', data.user.id);
    }
}

// Abonelik Satın Alma Fonksiyonu
async function subscribeUser(planId, userId) {
    console.log('Abonelik Satın Alma Fonksiyonu Çalıştırılıyor...');
    try {
        const response = await fetch(`${BACKEND_URL}/api/createCheckoutSession`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ planId, userId }),
        });

        const data = await response.json();

        if (response.ok) {
            // Stripe Checkout sayfasına yönlendirme
            window.location.href = data.sessionUrl;
        } else {
            console.error('Checkout Session Oluşturma Hatası:', data.message);
            alert('Checkout Session Oluşturma Hatası: ' + data.message);
        }
    } catch (error) {
        console.error('Checkout Session Oluşturma Hatası:', error.message);
        alert('Checkout Session Oluşturma Hatası: ' + error.message);
    }
}

// Önerileri Görselleştirme Fonksiyonu
async function displayRecommendations(packageName) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/analyzeMarket?market=${encodeURIComponent(packageName)}`, {
            method: 'GET',
        });

        const result = await response.json();
        if (!response.ok) {
            alert('Veri çekme hatası: ' + result.message);
            return;
        }

        const recommendationsDiv = document.getElementById('recommendations');
        recommendationsDiv.innerHTML = '';

        if (result.analysis.length === 0) {
            recommendationsDiv.innerHTML = '<p>Seçilen paket için analiz bulunamadı.</p>';
        } else {
            result.analysis.forEach(item => {
                const recommendationCard = document.createElement('div');
                recommendationCard.classList.add('recommendation-card');

                if (item.signal === 'Buy') {
                    recommendationCard.classList.add('strong-buy');
                } else if (item.signal === 'Sell') {
                    recommendationCard.classList.add('strong-sell');
                }

                recommendationCard.innerHTML = `
                    <h3>${item.signal} Sinyali</h3>
                    <p>Sembol: ${item.symbol}</p>
                    <p>RSI: ${item.rsi.toFixed(2)}</p>
                    <p>MACD: ${item.macd.toFixed(5)}</p>
                    <p>${item.textual_analysis}</p>
                `;

                recommendationsDiv.appendChild(recommendationCard);
            });
        }

    } catch (error) {
        console.error('Önerileri görüntüleme hatası:', error);
        alert('Önerileri görüntüleme hatası: ' + error.message);
    }
}

// DOMContentLoaded etkinliğinde Event Listener'lar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Finansal Analiz Platformu yüklendi.');

    // "Satın Al" Butonlarına Event Listener Ekleme
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const selectedPackage = button.getAttribute('data-package');
            console.log('Seçilen Paket:', selectedPackage);

            // Kullanıcı kimliğini dinamik olarak almanız gerekecek
            const userId = getUserId(); // Örneğin, kullanıcı oturumu sonrası alınabilir

            if (!userId) {
                alert('Lütfen önce giriş yapın.');
                return;
            }

            // PlanId'yi paket adına göre belirleyin
            const planId = getPlanId(selectedPackage);

            if (!planId) {
                alert('Geçersiz paket seçildi.');
                return;
            }

            // Stripe Checkout oturumu oluştur
            subscribeUser(planId, userId);
        });
    });

    // Giriş ve Kayıt Formları Arasında Geçiş
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Giriş ve Kayıt Butonlarına Event Listener Ekleme
    document.getElementById('login-btn').addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        signIn(email, password);
    });

    document.getElementById('register-btn').addEventListener('click', () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        signUp(email, password);
    });

    // Modal Kapatma İşlemi
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Modal Dışına Tıklanınca Kapatma
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.style.display = 'none';
        }
    });

    // Market Dropdown Event Listener
    const marketDropdown = document.getElementById('market-dropdown');
    if (marketDropdown) {
        marketDropdown.addEventListener('change', () => {
            const selectedPackage = marketDropdown.value;
            if (selectedPackage) {
                displayRecommendations(selectedPackage);
            } else {
                // Önerileri ve grafikleri temizleme
                const recommendationsDiv = document.getElementById('recommendations');
                recommendationsDiv.innerHTML = '';
                if (window.stockChartInstance) {
                    window.stockChartInstance.destroy();
                }
            }
        });
    }
});

// Plan adını planId'ye dönüştürme fonksiyonu
function getPlanId(planName) {
    switch (planName) {
        case 'Forex + Hisse Senedi Paketi':
            return 1;
        case 'Profesyonel Vadeli İşlemler Paketi':
            return 2;
        case 'Kripto Özel Paketi':
            return 3;
        case 'Deneme Paketi':
            return 4; // Deneme paketi için bir planId ekleyebilirsiniz
        default:
            return null;
    }
}

// Kullanıcı Kimliğini Alma Fonksiyonu
function getUserId() {
    const user = supabase.auth.user();
    return user ? user.id : null;
}

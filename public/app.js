// Homepage JavaScript
// Simple smooth scroll and animations

document.addEventListener('DOMContentLoaded', () => {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card, .step-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });

    // Mobile menu toggle (if needed in future)
    console.log('Mealky Way - Homepage loaded');

    // Fetch and display notice
    fetchNotice();
});

async function fetchNotice() {
    try {
        const response = await fetch('/api/notice');
        const data = await response.json();
        
        if (data.notice && data.notice.trim() !== '') {
            document.getElementById('noticeText').textContent = data.notice;
            document.getElementById('noticeSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error fetching notice:', error);
    }
}

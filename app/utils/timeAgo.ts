export function timeAgo(date: string | Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const seconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);

    // Less than 30 seconds shows as "şimdi"
    if (seconds < 30) {
        return 'şimdi';
    }

    // Less than 2 minutes shows as "1 dakika önce"
    if (seconds < 120) {
        return '1 dakika önce';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} dakika önce`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours === 1) {
        return '1 saat önce';
    }
    
    if (hours < 24) {
        return `${hours} saat önce`;
    }

    const days = Math.floor(hours / 24);
    if (days === 1) {
        return 'dün';
    }

    if (days < 7) {
        return `${days} gün önce`;
    }

    // After a week, show the actual date
    return messageDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
} 
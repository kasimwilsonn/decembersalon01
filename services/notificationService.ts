import { Bill, Staff, Appointment, NotificationSettings, Service } from '../types';

// Helper to get settings from local storage
const getSettings = (): NotificationSettings => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
        enabled: false,
        provider: 'MANUAL_LINK',
        triggers: {
            appointmentBooking: true,
            billGeneration: true,
            staffDailyReport: true,
            lowStock: false
        }
    };
};

export const generateWhatsAppLink = (phone: string, message: string) => {
    // Strip non-numeric characters from phone
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
};

export const sendBillNotification = async (bill: Bill, customerPhone: string) => {
    const settings = getSettings();
    if (!settings.enabled || !settings.triggers.billGeneration) return;

    const message = `Hello ${bill.customerName},\n\nThank you for visiting Z Bling! 💇‍♀️\n\nYour Invoice #${bill.id} for ₹${bill.total} is generated.\n\nServices: ${bill.items.map(i => i.name).join(', ')}\n\nWe hope to see you again soon!`;

    if (settings.provider === 'MANUAL_LINK') {
        const url = generateWhatsAppLink(customerPhone, message);
        window.open(url, '_blank');
        return { success: true, method: 'link' };
    } else {
        // Mock API Call
        console.log(`[API MOCK] Sending WhatsApp to ${customerPhone}: ${message}`);
        return { success: true, method: 'api' };
    }
};

export const sendAppointmentConfirmation = async (appt: Appointment, customerPhone: string, serviceNames: string[]) => {
    const settings = getSettings();
    if (!settings.enabled || !settings.triggers.appointmentBooking) return;

    const message = `Appointment Confirmed! ✅\n\nHi ${appt.customerName}, your appointment is scheduled for ${appt.date} at ${appt.time}.\n\nServices: ${serviceNames.join(', ')}\n\nSee you soon at Z Bling!`;

    if (settings.provider === 'MANUAL_LINK') {
        const url = generateWhatsAppLink(customerPhone, message);
        window.open(url, '_blank');
    } else {
        console.log(`[API MOCK] Sending Appointment SMS/WA to ${customerPhone}`);
    }
};

export const sendStaffDailyReport = async (staff: Staff, todayRevenue: number, serviceCount: number, target: number = 5000) => {
    const settings = getSettings();
    // Assuming staff report is manual trigger usually, but we check enabled
    if (!settings.enabled) return;

    const percentage = Math.min(100, Math.round((todayRevenue / target) * 100));
    const emoji = percentage >= 100 ? '🚀' : '📈';

    const message = `Daily Performance Report 📊\n\nHi ${staff.name},\n\nToday's Summary:\nServices Done: ${serviceCount}\nRevenue Generated: ₹${todayRevenue}\n\nTarget Achievement: ${percentage}% ${emoji}\n\nGreat work today!`;

    if (settings.provider === 'MANUAL_LINK') {
        const url = generateWhatsAppLink(staff.phone, message);
        window.open(url, '_blank');
    } else {
        console.log(`[API MOCK] Sending Staff Report to ${staff.phone}`);
    }
};
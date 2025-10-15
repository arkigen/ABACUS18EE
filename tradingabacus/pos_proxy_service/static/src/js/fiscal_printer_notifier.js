/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";

export class FiscalPrinterNotifier {
    constructor() {
        this.notificationContainer = null;
        this.initialize();
    }

    initialize() {
        // Create container for notifications if it doesn't exist
        if (!this.notificationContainer) {
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.className = 'fiscal-printer-notifications';
            this.notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 300px;
            `;
            document.body.appendChild(this.notificationContainer);
        }
    }

    show(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fiscal-printer-notification fiscal-printer-${type}`;
        notification.style.cssText = `
            padding: 12px 24px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-size: 14px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;

        // Add type-specific styles
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#000';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }

        // Add icon based on type
        const icon = document.createElement('i');
        icon.className = `fa ${this.getIconClass(type)} mr-2`;
        icon.style.marginRight = '8px';
        notification.appendChild(icon);

        // Add message
        const messageText = document.createTextNode(message);
        notification.appendChild(messageText);

        // Add to container
        this.notificationContainer.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            this.dismiss(notification);
        });

        // Auto dismiss after duration (if not error)
        if (type !== 'error' && duration > 0) {
            setTimeout(() => {
                this.dismiss(notification);
            }, duration);
        }

        return notification;
    }

    dismiss(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }

    getIconClass(type) {
        switch (type) {
            case 'success':
                return 'fa-check-circle';
            case 'warning':
                return 'fa-exclamation-triangle';
            case 'error':
                return 'fa-times-circle';
            default:
                return 'fa-info-circle';
        }
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    error(message, duration = 0) {  // 0 means it won't auto-dismiss
        return this.show(message, 'error', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
} 
/** @odoo-module **/

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { onMounted, onWillUnmount, useEffect } from "@odoo/owl";

patch(PaymentScreen.prototype, {
    setup() {
        super.setup();
        this.pos = usePos();
        this.electronicInvoiceButtonObserver = null;
        this.initializationCheckInterval = null;
        this.initializationAttempts = 0;
        this.MAX_INIT_ATTEMPTS = 25; // Slightly more attempts
        this.INIT_INTERVAL_MS = 200; // Slightly longer interval
        this.isButtonLogicInitialized = false; // Flag

        console.log("[L10N_BRANCH_MANAGER] PaymentScreen setup. Fiscal printer:", this.pos.config?.use_fiscal_printer);

        onMounted(() => {
            console.log("[L10N_BRANCH_MANAGER] PaymentScreen onMounted.");
            this._attemptButtonInitialization();
        });

        onWillUnmount(() => {
            console.log("[L10N_BRANCH_MANAGER] PaymentScreen onWillUnmount.");
            this._cleanup();
        });

        useEffect(() => {
            console.log("[L10N_BRANCH_MANAGER] useEffect for order state triggered.");
            if (this.isButtonLogicInitialized) {
                this._updateElectronicInvoiceButtonVisibility();
            } else {
                 // If not initialized, try again. This might be redundant if onMounted works,
                 // but acts as a fallback if the screen re-renders before onMounted finds the button.
                this._attemptButtonInitialization();
            }
        }, () => [this.currentOrder?.is_to_invoice(), this.currentOrder?.is_to_electronic_invoice()]);
    },

    _cleanup() {
        if (this.electronicInvoiceButtonObserver) {
            this.electronicInvoiceButtonObserver.disconnect();
            this.electronicInvoiceButtonObserver = null;
            console.log("[L10N_BRANCH_MANAGER] Observer disconnected.");
        }
        if (this.initializationCheckInterval) {
            clearInterval(this.initializationCheckInterval);
            this.initializationCheckInterval = null;
            console.log("[L10N_BRANCH_MANAGER] Initialization interval cleared.");
        }
    },

    _findElectronicInvoiceButton() {
        // Primarily use document.querySelector as this.el is unreliable early on.
        const button = document.querySelector('.js_electronic_invoice');
        if (button) {
            console.log("[L10N_BRANCH_MANAGER] Found .js_electronic_invoice button in document.");
        } else {
            console.log("[L10N_BRANCH_MANAGER] .js_electronic_invoice button NOT found in document.");
        }
        return button;
    },

    _attemptButtonInitialization() {
        if (this.isButtonLogicInitialized || this.initializationCheckInterval) {
            return; 
        }
        console.log("[L10N_BRANCH_MANAGER] Attempting button initialization...");
        this.initializationAttempts = 0;

        const tryInit = () => {
            this.initializationAttempts++;
            const button = this._findElectronicInvoiceButton();

            if (button && this.pos && this.pos.config) {
                console.log("[L10N_BRANCH_MANAGER] Button and POS config ready. Initializing logic.");
                this._updateElectronicInvoiceButtonVisibility(); 
                this._setupButtonObserver(button);
                this.isButtonLogicInitialized = true;
                this._cleanup(); // Clear interval
            } else if (this.initializationAttempts >= this.MAX_INIT_ATTEMPTS) {
                console.warn("[L10N_BRANCH_MANAGER] Max init attempts reached. Button or POS config not found.");
                this._cleanup();
            } else {
                console.log(`[L10N_BRANCH_MANAGER] Init attempt ${this.initializationAttempts}: Still waiting for button/config.`);
            }
        };
        this.initializationCheckInterval = setInterval(tryInit, this.INIT_INTERVAL_MS);
        tryInit(); // Attempt immediately once
    },

    _setupButtonObserver(buttonEl) {
        if (this.electronicInvoiceButtonObserver) { this.electronicInvoiceButtonObserver.disconnect(); }
        
        // Observe a more stable parent if possible, or a higher-level container for the payment screen buttons.
        // this.el might still be the payment screen's root, which is fine if the button is within it.
        const targetNodeToObserve = this.el || document.querySelector('.pos-content') || document.body;
        console.log("[L10N_BRANCH_MANAGER] Setting up MutationObserver on:", targetNodeToObserve);

        this.electronicInvoiceButtonObserver = new MutationObserver(() => {
            console.log("[L10N_BRANCH_MANAGER] DOM mutation detected, re-evaluating button visibility.");
            this._updateElectronicInvoiceButtonVisibility();
        });
        this.electronicInvoiceButtonObserver.observe(targetNodeToObserve, {
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['class', 'hidden'] 
        });
    },

    _updateElectronicInvoiceButtonVisibility() {
        const button = this._findElectronicInvoiceButton();
        if (!button || !this.pos || !this.pos.config || !this.currentOrder) {
            console.warn("[L10N_BRANCH_MANAGER] Update aborted: Pre-conditions not met (button/pos/config/order).");
            return;
        }
        const useFiscalPrinter = this.pos.config.use_fiscal_printer === true;
        const isToInvoice = this.currentOrder.is_to_invoice();
        const isToElectronicInvoice = this.currentOrder.is_to_electronic_invoice();

        console.log("[L10N_BRANCH_MANAGER] Update State:", { useFiscalPrinter, isToInvoice, isToElectronicInvoice });

        let shouldBeHidden = useFiscalPrinter || !isToInvoice;

        if (shouldBeHidden) {
            button.classList.add('hidden');
        } else {
            button.classList.remove('hidden');
        }
        console.log("[L10N_BRANCH_MANAGER] Button visibility set. Hidden:", shouldBeHidden);

        if (!shouldBeHidden && isToElectronicInvoice) {
            button.classList.add('highlight', 'text-bg-primary');
        } else {
            button.classList.remove('highlight', 'text-bg-primary');
        }
    },

    toggleIsToElectronicInvoice() {
        console.log("[L10N_BRANCH_MANAGER] toggleIsToElectronicInvoice called.");
        if (this.pos.config?.use_fiscal_printer === true) {
            if (this.currentOrder) {
                this.currentOrder.is_to_electronic_invoice = false;
            }
            this._updateElectronicInvoiceButtonVisibility(); 
            return;
        }
        super.toggleIsToElectronicInvoice(...arguments);
        // Ensure visibility is updated after the super call, as it might change currentOrder state.
        this._updateElectronicInvoiceButtonVisibility(); 
    },
    
    _shouldShowElectronicInvoiceButton() {
        const originalShow = super._shouldShowElectronicInvoiceButton?.() ?? true;
        let finalShow = originalShow;
        if (this.pos.config) {
            finalShow = originalShow && (this.pos.config.use_fiscal_printer === false);
        }
        console.log("[L10N_BRANCH_MANAGER] _shouldShowElectronicInvoiceButton evaluated:", { finalShow });
        return finalShow;
    }
}); 
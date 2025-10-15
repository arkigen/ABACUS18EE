/** @odoo-module **/

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";

patch(PaymentScreen.prototype, {
    setup() {
        super.setup();        
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.popup = useService("popup");
    },

    async _finalizeValidation() {
        const client = this.currentOrder.get_partner();
        let missingInfo = false;
        let messages = [];

        if (!client) {
        } else {
            if (!client.l10n_ar_afip_responsibility_type_id) {
                missingInfo = true;
                messages.push(_t("El cliente debe tener un tipo de responsabilidad AFIP válido."));
            }
            if (!client.vat) {
                missingInfo = true;
                messages.push(_t("El cliente debe tener un número de CUIT/DNI válido."));
            }
            if (client.l10n_ar_afip_responsibility_type_id && 
                client.l10n_ar_afip_responsibility_type_id[1] !== 'IVA Responsable Inscripto' &&
                client.l10n_ar_afip_responsibility_type_id[1] !== 'Responsable Monotributo' &&
                client.l10n_ar_afip_responsibility_type_id[1] !== 'Consumidor Final' &&
                client.l10n_ar_afip_responsibility_type_id[1] !== 'IVA Sujeto Exento'
            ) {
                missingInfo = true;
                messages.push(_t("El tipo de responsabilidad AFIP del cliente debe ser uno de los siguientes:\n" +
                    "- IVA Responsable Inscripto\n" +
                    "- Responsable Monotributo\n" +
                    "- Consumidor Final\n" +
                    "- IVA Sujeto Exento"));
            }
        }

        if (missingInfo && this.currentOrder.pos.config.use_fiscal_printer) {
            this.currentOrder.pos.notifier.warning(messages.join('\n\n'), 5000);
            return;
        }

        // Check fiscal printer state before proceeding with validation
        if (this.currentOrder.pos.config.use_fiscal_printer) {
            const printerStateResult = await this.currentOrder.pos.state_printer();
            // state_printer() returns null for major errors (network, config) and shows notifications.
            // If result is present, result.response === true means printer is ready.
            if (!printerStateResult || printerStateResult.response !== true) {
                // An error/warning notification would have already been shown by state_printer().
                // We add a specific message about validation being blocked.
                this.currentOrder.pos.notifier.error(_t("No se puede validar la orden: La impresora fiscal no está lista o no responde."), 5000);
                return; // Stop validation if printer is not ready
            }
        }

        try {
            const result = await super._finalizeValidation();
            
            if (this.currentOrder) {
                if (this.currentOrder.pos.config.use_fiscal_printer) {
                    try {
                        const response = await this.currentOrder.pos.print_pos_ticket();
                        if (!response) {
                            this.currentOrder.pos.notifier.warning(_t("La impresora fiscal no respondió. El pago fue procesado pero el ticket fiscal podría necesitar ser impreso manualmente."));
                        }
                    } catch (error) {
                        this.currentOrder.pos.notifier.warning(_t("Error al imprimir ticket fiscal. El pago fue procesado pero el ticket fiscal podría necesitar ser impreso manualmente."), 5000);
                    }
                } else {
                    // Validate order even without fiscal printer
                    await this.validateOrder();
                }
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    },

    async validateOrder(...args) {
        const currentOrder = this.currentOrder;
        let originalOrderBackendId = null;
        const isRefund = currentOrder.get_orderlines().some(line => line.get_quantity() < 0);

        if (isRefund) {
            const firstRefundLine = currentOrder.get_orderlines()[0];
            if (firstRefundLine && firstRefundLine.refunded_orderline_id) {
                const originalOrderLineId = firstRefundLine.refunded_orderline_id;
                try {
                    const lineData = await this.orm.read("pos.order.line", [originalOrderLineId], ["order_id"]);
                    if (lineData && lineData.length > 0 && lineData[0].order_id) {
                        originalOrderBackendId = lineData[0].order_id[0]; // order_id is [id, name]
                    }
                } catch (e) {
                    console.error("POS Reembolso Custom (PaymentScreen): Error fetching original order line details:", e);
                }
            }
        }

        if (originalOrderBackendId && isRefund) {
            try {
                const originalOrderData = await this.orm.read(
                    "pos.order",
                    [originalOrderBackendId],
                    ["partner_id", "name"]
                );

                if (originalOrderData && originalOrderData.length > 0) {
                    const originalOrderDetails = originalOrderData[0];
                    if (!originalOrderDetails.partner_id) {
                        if (currentOrder.get_partner()) { // Only change if a partner is currently set
                            currentOrder.set_partner(null);
                            const message = _t("Partner removed from refund: Original order '%s' had no customer.", originalOrderDetails.name);
                            this.notification.add(message, 4000);
                        }
                    }
                } else {
                    const message = _t("Details for original order (ID: %s) not found. Cannot verify customer.", originalOrderBackendId);
                    this.notification.add(message, 4000);
                }
            } catch (error) {
                console.error(`POS Reembolso Custom (PaymentScreen): ORM call failed for original order ID ${originalOrderBackendId}. Error: ${error.message}`, error);
                await this.popup.add("ErrorPopup", {
                    title: _t("Network Error"),
                    body: _t("Could not verify the original order's customer due to a network issue. The refund will proceed with the customer currently set (if any)."),
                });
            }
        }
        return super.validateOrder(...args);
    }
});
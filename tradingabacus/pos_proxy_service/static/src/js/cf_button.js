/** @odoo-module **/

import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { useService } from "@web/core/utils/hooks";
import { Component, useState, onMounted, onWillStart, onWillUnmount } from "@odoo/owl";
import { SelectionPopup } from "@point_of_sale/app/utils/input_popups/selection_popup";
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";

export class CfTicketButtons extends Component {
    static template = "pos_proxy_service.CfTicketButtons";
    static props = {};
    
    setup() {
        super.setup();
        this.dialogService = useService("dialog");
        this.pos = useService("pos");
        this.popup = useService("popup");
        
        onWillStart(() => {});
        onMounted(() => {});
        onWillUnmount(() => {});
    }
    
    async onClick() {
        const listaCierres = [
            {
                id: "1",
                label: "Cierre X",
                item: "x",
            },
            {
                id: "2",
                label: "Cierre Z",
                item: "z",
            },
        ];

        const { confirmed, payload } = await this.popup.add(SelectionPopup, {
            title: _t('Cierre Fiscal'),
            list: listaCierres,
        });

        if (confirmed && payload) {
            if (payload === 'z') {
                const con = confirm("¿Esta seguro de imprimir cierre Z?");
                if (!con) {
                    return;
                }
            }

            try {
                await this.pos.print_pos_fiscal_close(payload);
            } catch (error) {
                console.error("[CF Button] Error printing fiscal close:", error);
            }
        }
    }
}

ProductScreen.addControlButton({
    component: CfTicketButtons,
    condition: function() {
        return this.pos.config.use_fiscal_printer;
    },
});

registry.category("pos_buttons").add("cf_ticket_buttons", {
    position: ["before", "payment"],
    component: CfTicketButtons,
    condition: (env) => {
        return env.pos.config.use_fiscal_printer;
    },
});

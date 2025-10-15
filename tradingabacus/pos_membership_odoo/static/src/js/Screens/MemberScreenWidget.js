/** @odoo-module */

import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { Product } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { _t } from "@web/core/l10n/translation";
import { ConnectionLostError } from "@web/core/network/rpc_service";
import { ApplyMembershipPopupWidget } from "@pos_membership_odoo/js/Popup/ApplyMembershipPopupWidget";

patch(PaymentScreen.prototype, {

    setup() {
        super.setup()
    },

    async selectMemberShip() {
        var self = this;

        this.popup.add(ApplyMembershipPopupWidget, {
            title: _t("Confirm?"),
            confirmText: _t("Apply"),
            cancelText: _t("Cancel"),
        });
    }
});
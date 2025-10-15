/** @odoo-module */

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { useBarcodeReader } from "@point_of_sale/app/barcode/barcode_reader_hook";

export class BarcodePopup extends AbstractAwaitablePopup {
    static template = "sh_pos_manager_validation.BarcodePopup";
    setup() {
        super.setup();
        this.props.confirmKey = ""
        this.pos = usePos();
        this.popup = useService("popup");
        useBarcodeReader({
            product: this.shbarcodeProductAction,
        }, true)
    }
    shbarcodeProductAction(code) {
        if(this.pos.get_order().manager_barcode.length){
            if(this.pos.get_order().manager_barcode.includes(code.code)){
                this.pos.first_attempt =  false
                this.confirm()
                return true
            }
            else{
                 this.popup.add(ErrorPopup, {
                    title: 'Incorrect Barcode',
                    body:'Please, Scan correct Barcode...'
                });
                this.cancel()
                return false
            }
        }
        else{
            this.popup.add(ErrorPopup, {
                title: 'Add Manager Barcode',
                body:'Please, Add Manager Barcode.'
            });
        }
        return false
    }
}

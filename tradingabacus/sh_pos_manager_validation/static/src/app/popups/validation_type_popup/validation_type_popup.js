/** @odoo-module */

import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";

export class ShValodationTypePopup extends AbstractAwaitablePopup {
    static template = "sh_pos_manager_validation.ShValodationTypePopup";
    setup() {
        super.setup();
        this.pos = usePos();
        this.props.confirmKey = ""
        this.popup = useService("popup");
    }
    async open_barcodePopup(){
        if(this.props.order){
            let res =await this.props.order.barcodepopup()
            if(res){
            this.confirm()
            }
            else{
                this.cancel()
            }
        }else{
            let res =await this.pos.get_order().barcodepopup()
            if(res){
             this.confirm()
            }
            else{
                this.cancel()
            }
        }
    
    }
    async open_passwordPopup(){
        if(this.props.order){
            let res = await this.props.order.passwordpopup()
            if(res){
                this.confirm()
            }
            else{
                this.cancel()
            }
        }else{
            let res = await this.pos.get_order().passwordpopup()
            if(res){
                this.confirm()
            }
            else{
                this.cancel()
            }
        }
    }        
    async numberpopup(){
        if(this.props.order){
            let res = await this.props.order.numberpopup()
            if(res){
                this.confirm()
            }
            else{
                this.cancel()
            }
        }else{
            let res = await this.pos.get_order().numberpopup()
            if(res){
                this.confirm()
            }
            else{
                this.cancel()
            }
        }
    }

    cancel(){
        super.cancel()
        if(this.props.order){
            this.props.order.number_buffer_reset = false
        }else{
            this.pos.get_order().number_buffer_reset = false
        }
    }
}

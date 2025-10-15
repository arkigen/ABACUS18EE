/** @odoo-module */

import { PosStore } from "@point_of_sale/app/store/pos_store";
import { Order ,Orderline } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";
import { NumberPopup } from "@point_of_sale/app/utils/input_popups/number_popup";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { useService } from "@web/core/utils/hooks";
import { ShValodationTypePopup } from "@sh_pos_manager_validation/app/popups/validation_type_popup/validation_type_popup";
import { BarcodePopup } from "@sh_pos_manager_validation/app/popups/barcode_popup/barcode_popup";
import { passwordPopup } from "@sh_pos_manager_validation/app/popups/password_popup/password_popup";


patch(PosStore.prototype, {
    // @Override
    async _processData(loadedData) {
        await super._processData(...arguments);
            var self = this;
            self.sh_users = Object.values(loadedData['sh_all_users']) ;
            self.qty_value = true;
            self.price_value = true
            self.discount_value = true
            self.first_attempt = true
            self.order_validation = false        
            self.is_pop_up_open = false
    },
});
patch(Orderline.prototype, {
    set_quantity(quantity, keep_price){
        if(this.pos.config.sh_pos_manager_validation && (this.pos.config.sh_order_line_delete_pw || this.pos.config.sh_dicount_pw || this.pos.config.sh_qty_pw || this.pos.config.sh_price_pw)){
            if(this.order && this.order.number_buffer_reset){
                return false
            }
            else{
                return super.set_quantity(quantity, keep_price)
            }
        }
        else{
            return super.set_quantity(quantity, keep_price)
        }

    }
});

patch(Order.prototype, {
    setup() {
        super.setup(...arguments);
        // this.numberBuffer = useService("number_buffer");
        var self = this
        self.manager_password = []
        self.manager_pin = []
        self.manager_barcode= []
        self.one_time_validation = false
        self.number_buffer_reset = false;
        let maped = this.pos.sh_users.filter(obj => this.pos.config.sh_manger_ids.includes(obj.id));
        for(let manager of maped){
            self.manager_pin.push(manager.sh_pin)
            self.manager_password.push(manager.sh_password)
            self.manager_barcode.push(manager.sh_barcode)
        }
    },
    async barcodepopup(){
        this.pos.is_pop_up_open = true
        const { confirmed, payload } =   await this.env.services.popup.add(BarcodePopup)
            if(confirmed){
                this.pos.is_pop_up_open = false
                this.pos.first_attempt =  false
                return true
            }
            else{
                this.pos.is_pop_up_open = false
                return false
            }

    },

    async numberpopup(){
        this.pos.is_pop_up_open = true
        const { confirmed, payload } = await this.env.services.popup.add(NumberPopup, { isPassword: true, title:("Enter Manager Password") })
        if(confirmed){
            if(this.manager_pin.length){
                if(this.manager_pin.includes(parseInt(payload))){
                    this.pos.first_attempt =  false
                    this.pos.is_pop_up_open = false
                    return true
                }
                else{
                    await this.env.services.popup.add(ErrorPopup, {
                        title: 'Incorrect PIN',
                        body:'Please, Enter correct PIN...'
                    });
                    this.pos.is_pop_up_open = false
                    return false
                }
            }
            else{
                this.pos.is_pop_up_open = false
                this.env.services.popup.add(ErrorPopup, {
                    title: 'Add Manager PIN',
                    body:'Please, Add Manager PIN...'
                });
                return false
            }
        }
        else{
            this.pos.is_pop_up_open = false
            return false
        }
    },
    async passwordpopup(){
        this.pos.is_pop_up_open = true
        const { confirmed } = await await this.env.services.popup.add(passwordPopup)
        if (confirmed) {
            this.pos.is_pop_up_open = false
            let password = $("#password").val()
            if(this.manager_password.length){
                if (this.manager_password.includes(password)) {
                    this.pos.first_attempt =  false
                    return true
                }
                else {
                    await this.env.services.popup.add(ErrorPopup, {
                        title: 'Wrong Password!',
                        body: 'Please, Enter correct password...'
                    });
                    this.pos.is_pop_up_open = false
                    return false
                }
            }
            else {
                await this.env.services.popup.add(ErrorPopup, {
                    title: 'Add Manager Password',
                    body:'Please, Add Manager Password.'
                });
                this.pos.is_pop_up_open = false
                return false
            }
        }
        else {
            this.pos.is_pop_up_open = false
            return false
        }
    },
    async add_paymentline(payment_method){
        if(this.pos.config.sh_pos_manager_validation && this.pos.config.sh_validation_on_payment_method){
                if(this.pos.get_order().one_time_validation == false){
                    if(this.pos.config.sh_select_method_ids){
                        if(this.pos.config.sh_select_method_ids.includes(payment_method.id)){
                            let validation_type = this.pos.config.sh_validation_type
                            if (validation_type == 'pin') {
                                let res= await this.numberpopup()
                                if(res){
                                    if(this.pos.config.sh_one_time_password){
                                        this.one_time_validation = true
                                    }
                                    return super.add_paymentline(payment_method)
                                }
                                else{
                                    return false
                                }
                             }
                            else if (validation_type == 'password') {
                                let res = await this.passwordpopup()
                                if(res){
                                    if(this.pos.config.sh_one_time_password){
                                        this.one_time_validation = true
                                    }
                                    return super.add_paymentline(payment_method)
                                }
                                else{
                                    return false
                                }
                            }
                            else if (validation_type == 'barcode') {
                                let res = await this.barcodepopup()
                                if(res){
                                    if(this.pos.config.sh_one_time_password){
                                        this.one_time_validation = true
                                    }
                                   return super.add_paymentline(payment_method)
                                }
                                else{
                                    return false
                                }
                            }
                            else{
                                this.number_buffer_reset = true
                                const { confirmed , payload} = await this.env.services.popup.add(ShValodationTypePopup)
                                
                                if(confirmed){
                                    if(this.pos.config.sh_one_time_password){
                                        this.one_time_validation = true
                                    }
                                   return super.add_paymentline(payment_method)
                                }
                                else{
                                    // this.numberBuffer.reset();
                                   return false
                                }
                            }
                        }
                        else{
                           return super.add_paymentline(payment_method)
                        }
                    }
                    else{
                       return super.add_paymentline(payment_method)
                    }
                }
                else{
                   return super.add_paymentline(payment_method)
                }
        }
        else{
           return super.add_paymentline(payment_method)
        }
    },
    async pay(){
        if (this.pos.config.sh_pos_manager_validation && this.pos.get_order().one_time_validation == false && this.pos.config.sh_payment_pw) {
            let validation_type = this.pos.config.sh_validation_type
            if (validation_type == 'pin') {
                let res= await this.pos.get_order().numberpopup()
                if(res){
                    await super.pay()
                    if (this.pos.config.sh_one_time_password) {
                    this.pos.get_order().one_time_validation = true
                }
                }
                else{
                    return false
                }
                }
            else if (validation_type == 'password') {
                let res = await this.pos.get_order().passwordpopup()
                if(res){
                    await super.pay()
                    if (this.pos.config.sh_one_time_password) {
                        this.pos.get_order().one_time_validation = true
                    }
                }
                else{
                    return false
                }
            }
            else if (validation_type == 'barcode') {
                let res =await this.pos.get_order().barcodepopup()
                if(res){
                    await super.pay()
                    if (this.pos.config.sh_one_time_password) {
                        this.pos.get_order().one_time_validation = true
                    }
                }
                else{
                    return
                }
            }
            else {
                const { confirmed, payload } = await this.env.services.popup.add(ShValodationTypePopup)
                if (confirmed) {
                    await super.pay()
                    if (this.pos.config.sh_one_time_password) {
                        this.pos.get_order().one_time_validation = true
                    }
                }
                else{
                    return
                }
            }
        }
        else {
            await super.pay()
        }
    },
});
/** @odoo-module **/

import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import { usePos } from "@point_of_sale/app/store/pos_hook";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { Component, onMounted, useExternalListener, useState } from "@odoo/owl";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup"
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";

export class ApplyMembershipPopupWidget extends AbstractAwaitablePopup {
    static template = "pos_membership_odoo.ApplyMembershipPopupWidget";

    setup() {
		super.setup();
		this.pos = usePos();
		this.orm = useService("orm");
		let self = this;
		onMounted(() => {
           	self.mounted();
        });
	}

	mounted() {
		$('#enter_card_code').on('focus', function() {
			$('body').off(this.keyboard_handler);
			$('body').off(this.keyboard_keydown_handler);
			window.document.body.removeEventListener('keypress', self.keyboard_handler);
			window.document.body.removeEventListener('keydown', self.keyboard_keydown_handler);
		});
		$('#enter_card_code').on('change', function() {
			$('body').keypress(this.keyboard_handler);
			$('body').keydown(this.keyboard_keydown_handler);
			window.document.body.addEventListener('keypress', this.keyboard_handler);
			window.document.body.addEventListener('keydown', self.keyboard_keydown_handler);
		});
	}

	check_discount_applied(){
		var self = this;
		var order = self.pos.get_order();
		var orderlines = order.get_orderlines();
		var flag = true		
		for (var i = 0; i < orderlines.length; i++) {
			if(orderlines[i].get_discount() != 0.0){
				flag = false
			}
		}
		return flag
	}

	apply_membership_card() {
		var self = this;
		var order = self.pos.get_order();
		var orderlines = order.get_orderlines();
		var entered_code = $("#enter_card_code").val();
		var used = false;
		var partner_id = false
		let rpc_result = false;
		if (order.get_partner() != null)
			partner_id = order.get_partner();
		if (!partner_id) {
			this.pos.popup.add(ErrorPopup, {
				'title': _t('Unknown customer'),
				'body': _t('You cannot use Membership Card Code. Select customer first.'),
			});
			return;
		}
		if (orderlines.length === 0) {
			this.pos.popup.add(ErrorPopup, {
				'title': _t('Empty Order'),
				'body': _t('There must be at least one product in your order before it can be apply for Membership Card Code.'),
			});
			return;
		}


		self.orm.call(
            'pos.membership',
            'apply_membership_cards',
            [partner_id ? partner_id.id : 0, entered_code],
        ).then(function(output) {
            if (output) {
					self.orm.call(
						'pos.membership',
						'search_membership_cards',
						[partner_id ? partner_id.id : 0, entered_code],
					).then(function(output) {
						var membership_discount = output[1];
						var expiry = output[2];

						var future_date = output[6];

						if(future_date == false){
							return self.pos.popup.add(ErrorPopup, {
								'title': _t('Membership Invalid !!!'),
								'body': _t("This Membership Card Is Not Applicable Today"),
							});
						}

						if(expiry == false){
							return self.pos.popup.add(ErrorPopup, {
								'title': _t('Membership Invalid !!!'),
								'body': _t("This Membership Card Is Expired"),
							});
						}
						var membership_partner = output[3];
						var current_date = new Date().toUTCString();
						var d = new Date();
						var month = '' + (d.getMonth() + 1);
						var day = '' + d.getDate();
						var year = d.getFullYear();
						var date_format = [year, month, day].join('-');
						var apply_membershipcards =  output[4];
						var apply_membership_discount = output[5];
						var hours = d.getHours();
						var minutes = d.getMinutes();
						var seconds = d.getSeconds();
						var time_format = [hours, minutes, seconds].join(':');
						var date_time = [date_format, time_format].join(' ');

						if (membership_partner != partner_id.id){
							self.pos.popup.add(ErrorPopup, {
								'title': _t('Invalid Customer !!!'),
								'body': _t("This Membership Card Code is not applicable for this Customer"),
							});
						}
						else { // if coupon is not used
							var pricelist_id = membership_discount;
							self.orm.call(
								'pos.membership',
								'apply_pricelist',
								[pricelist_id ? pricelist_id : 0, pricelist_id],
							).then(function(output) {
								var flag = self.check_discount_applied()
								var count = 0.0
								for (var i = 0; i < orderlines.length; i++) {
									var lines = orderlines[i];
									var price = orderlines[i].price;
									if(apply_membershipcards){
										if(apply_membership_discount == 'ignore_all_orderlines')
										{
											if(flag){
												$.each(output,function(index,value){
													price = output[orderlines[i].product.id][pricelist_id];
												});
												lines.set_unit_price(price);
												$(".membershipmessage").html("<strong>" + "Congratulations... Membership Discount Applied</b>");
											}else{
												self.pos.popup.add('ErrorPopup', {
													'title': _t('Membership Discount Not Apply !!!'),
													'body': _t('Already Some Discount Applied In Your Order So Membership Discount Not Applicable'),
												});		
												return;										
											}
										}else if(apply_membership_discount == "ignore_specific_orderlines"){
											if(lines.get_discount() == 0.0){
												$.each(output,function(index,value){
													price = output[orderlines[i].product.id][pricelist_id];
												});
												lines.set_unit_price(price);
												$(".membershipmessage").html("<strong>" + "Congratulations... Membership Discount Applied</b>");
											}
										}
									}else{
										$.each(output,function(index,value){
											price = output[orderlines[i].product.id][pricelist_id];
										});
										lines.set_unit_price(price);
										$(".membershipmessage").html("<strong>" + "Congratulations... Membership Discount Applied</b>");
									}								
								}
								order.set_pos_membership_code(entered_code)
								self.cancel();
								
							});
						}
					});
			} else {
				self.pos.popup.add(ErrorPopup, {
					'title': _t('Invalid Membership Card Code !!!'),
					'body': _t("Membership Card Code Entered by you is Invalid. Enter Valid Code..."),
				});
				// return;
			}
        })

	}

}
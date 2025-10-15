/** @odoo-module */

import { Order, Orderline, Payment } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";
import { roundPrecision as round_pr } from "@web/core/utils/numbers";
import { usePos } from "@point_of_sale/app/store/pos_hook";

patch(Order.prototype, {

    setup(_defaultObj, options) {
		super.setup(...arguments);
		// this.pos = usePos();
		this.pos_membership_code = this.pos_membership_code || false;
	},
	
	init_from_JSON(json){
		super.init_from_JSON(...arguments);			
		this.pos_membership_code = json.pos_membership_code || false;
	},

	export_as_JSON(){
		const json = super.export_as_JSON(...arguments);			
		json.pos_membership_code = this.pos_membership_code;
		return json;
	},

	set_pos_membership_code(set_pos_membership_code){
		this.pos_membership_code = set_pos_membership_code || '';
	},
	
	get_pos_membership_cod () {
		return this.pos_membership_code;
	},
});

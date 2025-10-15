odoo.define('pos_membership_odoo.member_card', function(require) {
	"use strict";

	var models = require('point_of_sale.models');
	var core = require('web.core');

	var QWeb = core.qweb;
	var _t = core._t;
    
    console.log('pos_membership_odoo.member_card');
		
	var posorder_super = models.Order.prototype;
	models.Order = models.Order.extend({

		initialize: function(attr,options) 
        {
			var self = this;
			this.pos_membership_code    = '';
			posorder_super.initialize.call(this,attr,options);
            console.log('initialize assign_client event');
            
		},
		
		set_pos_membership_code: function(set_pos_membership_code)
        {
            var self = this;
			this.pos_membership_code = set_pos_membership_code || '';
			this.trigger('change',this);
            self.assign_client(self.pos_membership_code);
            console.log('trigger assign_client partner');
		},
        
        assign_client: function(graphic_code)
         {
            var self = this;
            var order = self.env.pos.get_order();  
            var fields = ['partner_id'];
            var domain = [['membership_code','=',String(graphic_code)]];
            var partner_id = null;
            rpc.query({
                        model: 'pos.membership',
                        method: 'search_read',
                        args: [domain, fields],
                        limit: 1,
                      },
                      {
                        timeout: 3000,
                        shadow: true,
                      })
                .then(function (partner) 
                    {
                        if(partner)
                            {
                                if(partner[0].id)
                                    {
                                        partner_id = partner[0].partner_id[0];
                                        order.set_client(self.env.pos.db.get_partner_by_id(partner_id));
                                    }
                            }
                    });  
                return partner_id;
        }	    
	});
	
});
# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.

from odoo import  fields, models,api,_
from odoo.exceptions import UserError


class ShResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    
    sh_pos_manager_validation  = fields.Boolean(string="POS Manager Validation" ,related='pos_config_id.sh_pos_manager_validation',domain="[('share', '=', False)]" ,readonly=False )
    sh_manger_ids = fields.Many2many('res.users', string='Manager' ,related='pos_config_id.sh_manger_ids' ,readonly=False)
    sh_one_time_password  = fields.Boolean(string="One Time Password In Order",related='pos_config_id.sh_one_time_password' ,readonly=False)
    sh_order_line_delete_pw  = fields.Boolean(string=' Delete order line',related='pos_config_id.sh_order_line_delete_pw' ,readonly=False)
    sh_oreder_delete_pw  = fields.Boolean(string='Order Deletion',related='pos_config_id.sh_oreder_delete_pw' ,readonly=False)
    sh_dicount_pw  = fields.Boolean(string='Discount validation',related='pos_config_id.sh_dicount_pw' ,readonly=False)
    sh_price_pw  = fields.Boolean(string='Price validation',related='pos_config_id.sh_price_pw' ,readonly=False)
    sh_qty_pw  = fields.Boolean(string='Quantity validation',related='pos_config_id.sh_qty_pw' ,readonly=False)
    sh_payment_pw  = fields.Boolean(string='Payment validation',related='pos_config_id.sh_payment_pw' ,readonly=False)
    sh_refund_pw  = fields.Boolean(string='Order refund validation',related='pos_config_id.sh_refund_pw' ,readonly=False)
    sh_validation_type  = fields.Selection(related='pos_config_id.sh_validation_type', readonly=False, required=True)
    sh_validation_on_payment_method  = fields.Boolean(string="Validation On Payment Methods", related='pos_config_id.sh_validation_on_payment_method' ,readonly=False)
    sh_select_method_ids = fields.Many2many('pos.payment.method','name', string ="Type of Payment", related='pos_config_id.sh_select_method_ids' ,readonly=False)
    sh_cash_move_validation = fields.Boolean(string="Add validation on cash out or cash in ", related='pos_config_id.sh_cash_move_validation' ,readonly=False)
    sh_virtual_keyboard = fields.Boolean(string="Virtual Keyboard",  related='pos_config_id.sh_virtual_keyboard' ,readonly=False)

    # def set_values(self):
    #     if self.sh_pos_manager_validation and not self.sh_validation_type:
    #         raise UserError(_('Please Select Validation Type'))
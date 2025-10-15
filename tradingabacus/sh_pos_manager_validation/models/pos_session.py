# -*- coding: utf-8 -*-
# Part of Softhealer Technologies.

from odoo import models

class PosSessionInherit(models.Model):
    _inherit = 'pos.session'

    def _pos_data_process(self, loaded_data):
        super()._pos_data_process(loaded_data)
        users = self.env['res.users'].search_read([('share', '=', False)],['sh_barcode','sh_password','sh_pin', 'name', 'groups_id'] )
        loaded_data['sh_all_users'] = {user['id']: user for user in users}

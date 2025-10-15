# -*- coding: utf-8 -*-
from odoo import fields, models, api, _, tools
from odoo.exceptions import UserError, ValidationError
import random
from datetime import date, datetime
import logging
_logger = logging.getLogger(__name__)


class res_partner(models.Model):
    _inherit = 'res.partner'
    
    @api.onchange('vat')
    def onchange_partner_id_vat(self):
        if isinstance(self.id, int):
            membership = self.env['pos.membership'].browse(
                [['partner_id', '=', int(self.id)]], limit=1)
        else:
            pass
from odoo import fields, models, api, _ , tools
from odoo.exceptions import UserError, ValidationError
import random
from datetime import date, datetime
import logging
_logger = logging.getLogger(__name__)

class pos_membership_setting(models.Model):
    _inherit = 'pos.membership.setting'
 
    after_amount = fields.Float(string='Aplicar Después')


class pos_membership(models.Model):
    _inherit = 'pos.membership'
 
    @api.onchange('partner_id')
    def onchange_partner_id(self):
        self.membership_code = self.partner_id.vat
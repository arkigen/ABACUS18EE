from odoo import api, fields, tools, models, _
from odoo.exceptions import UserError



class PosConfig(models.Model):
	_inherit = 'pos.config'

	use_fiscal_printer = fields.Boolean(string='Impresora Fiscal', default=False)
	proxy_fiscal_printer = fields.Char(string='IP', default='http://127.0.0.1:5005')
	version_printer = fields.Selection([
		('epsont900fa', 'Epson T900FA'),
		('hasar250', 'Hasar 250'),		
	], string='Printer Version', default='epsont900fa')
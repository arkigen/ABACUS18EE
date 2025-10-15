# -*- coding: utf-8 -*-
# Part of BrowseInfo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models, api, _ , tools
from odoo.exceptions import UserError, ValidationError
import random
from datetime import date, datetime
import logging
_logger = logging.getLogger(__name__)

class ReportPaperFormateInherit(models.Model):

	_inherit = "report.paperformat"

	page_height = fields.Float('Page height (mm)', default=False)
	page_width = fields.Float('Page width (mm)', default=False)


class pos_membership_setting(models.Model):
	_name = 'pos.membership.setting'
	_description = "Pos Membership Setting"

	name  = fields.Char('Name', default='Configuration for POS Membership Cards')
	issue_date  =  fields.Date('Issue Date', default = fields.Date.today, )
	default_name  = fields.Char('Name.')
	pricelist_id  =  fields.Many2one('product.pricelist', string='Pricelist')
	
	allow_one_customer = fields.Boolean('Allow One Membership Card per Customer')
	apply_membershipcards = fields.Boolean(' Ignore Membership Discount If Discount Already Exists')
	apply_membership_discount = fields.Selection([('ignore_all_orderlines', 'Ignore membership discounts for all orderlines'), ('ignore_specific_orderlines', 'Ignore membership discounts for only those orderlines where discount exists.') ])
	activet = fields.Boolean(
		string='Active',readonly=True,
	)

	def toggle_active_record(self):
		all_record = self.env['pos.membership.setting'].search([('activet','=',True)],limit=1)
		
		if not all_record:
			
			if self.activet == False:
				self.activet = True
			return;
		elif not self.activet and (len(all_record) == 1):
			
			if self.activet == True:
				self.activet = False
			else:
				raise ValidationError("You can't have two active membership configuration.")

			self.write({"activet":False});
		else:

			if self.activet == True:
				self.activet = False
				

class pos_membership(models.Model):
	_name = 'pos.membership'
	_description = "Pos Membership"

	def print_membership_card_report(self):
		return self.env.ref('pos_membership_odoo.action_membership_cards').report_action(self)
		
	def apply_membership_cards(self, code):
		membership_code_record =self.search([('membership_code', '=',code),('is_used','=',False)])
		if len(membership_code_record) == 1:
			membership_record = membership_code_record[0]
			return True
		else:
			return False

	def search_membership_cards(self, code):
		membership_code_record = self.search([('membership_code', '=', code),('is_used','=',False)])
		if membership_code_record:
			if membership_code_record.expiry_date:

				if (membership_code_record.issue_date > date.today()):
					if( membership_code_record.expiry_date >= date.today()):
						return [membership_code_record.membership_code, membership_code_record.membership_id.pricelist_id.id, membership_code_record.expiry_date, membership_code_record.partner_id.id ,membership_code_record.membership_id.apply_membershipcards , membership_code_record.membership_id.apply_membership_discount, False  ]
					else:
						return [ membership_code_record.membership_code, membership_code_record.membership_id.pricelist_id.id, False, membership_code_record.partner_id.id ,membership_code_record.membership_id.apply_membershipcards , membership_code_record.membership_id.apply_membership_discount, False  ]
				else:
					if( membership_code_record.expiry_date >= date.today()):
						return [membership_code_record.membership_code, membership_code_record.membership_id.pricelist_id.id, membership_code_record.expiry_date, membership_code_record.partner_id.id ,membership_code_record.membership_id.apply_membershipcards , membership_code_record.membership_id.apply_membership_discount,membership_code_record.issue_date  ]
					else:
						return [ membership_code_record.membership_code, membership_code_record.membership_id.pricelist_id.id, False, membership_code_record.partner_id.id ,membership_code_record.membership_id.apply_membershipcards , membership_code_record.membership_id.apply_membership_discount, membership_code_record.issue_date  ]	

			else:
				if (membership_code_record.issue_date > date.today()):
					return [ membership_code_record.membership_code, membership_code_record.membership_id.pricelist_id.id, membership_code_record.expiry_date, membership_code_record.partner_id.id ,membership_code_record.membership_id.apply_membershipcards , membership_code_record.membership_id.apply_membership_discount , False ]
				else:
					return [ membership_code_record.membership_code, membership_code_record.membership_id.pricelist_id.id, membership_code_record.expiry_date, membership_code_record.partner_id.id ,membership_code_record.membership_id.apply_membershipcards , membership_code_record.membership_id.apply_membership_discount,membership_code_record.issue_date  ]


			

	def apply_pricelist(self, pricelist_id):
		main_dict = {}
		product_obj = self.env['product.product']
		product_ids = product_obj.search([])
		
		product_pricelist = self.env['product.pricelist'].browse(pricelist_id)
		for product_id in product_ids:
			quantity = 1
			price = product_pricelist._price_get(product_id, quantity)
			price.update({'product_id':product_id.id })
			main_dict.update({product_id.id : price})
		return main_dict
								
	@api.model
	def create(self, vals):

		pos_config_obj = self.env['pos.membership.setting']

		code = (random.randrange(1111111111,9999999999))

		membership = self.env['pos.membership'].search_count([('partner_id','=', vals['partner_id']),('is_used','=',False)])
		membership_conf = pos_config_obj.search([('activet','=',True)],limit=1)
		if membership >= 1 and membership_conf.allow_one_customer == True:
			raise ValidationError(_('According to Membership Configuration ,Only One Card Assign to Customer'))
		else:
			hide_barcode = str(code)
			hide_barcode = hide_barcode[:6].ljust(len(hide_barcode), "*")
			vals.update({
				'membership_code': code,
				'hide_barcode': hide_barcode,
			})
			return super(pos_membership, self).create(vals)


	@api.constrains('partner_id')
	@api.onchange('partner_id')    
	def _check_something(self):
		pos_config_obj = self.env['pos.membership.setting']
		
		membership = self.env['pos.membership'].search_count([('partner_id','=', self.partner_id.id)])
		membership_conf = pos_config_obj.search([('activet','=',True)],limit=1)

		if membership > 1 and membership_conf.allow_one_customer == True:
			raise UserError(_('Please configure membership'))
		

		
	def _set_default_template(self):
		return self.env['pos.membership.template.settings'].search([('if_default_template','=',True)]).id


	membership_id  =  fields.Many2one('pos.membership.setting', string='Membership',domain="[('activet', '=', True)]")
	name  = fields.Char('Name')
	membership_code = fields.Char('Membership Code')
	barcode_img =  fields.Binary('Membership Barcode Image')
	hide_barcode = fields.Char('Hidden Barcode')
	issue_date  =  fields.Date(default=fields.Date.today, )
	expiry_date  = fields.Date('Expiry Date')
	partner_id  =  fields.Many2one('res.partner', string='Customer')
	is_used = fields.Boolean('Used Coupon', copy=False , default = False)
	membership_template  =  fields.Many2one('pos.membership.template.settings', string='Template',default=_set_default_template)
	

class PosMembershipFrontImage(models.Model):

	_name = 'pos.membership.front.image'
	_description = "Pos Membership Front Image"

	partner_id  =  fields.Many2one('res.partner')
	membership_template = fields.Many2one('pos.membership.template.settings')
	
	def print_membership_card_front_img(self):
		curr_card = self.env['pos.membership'].search([('id','=',self._context.get('active_id'))])
		
		if curr_card.membership_template:
			self.membership_template = curr_card.membership_template.id
		else:
			self.membership_template = False

		if curr_card.partner_id:
			self.partner_id = curr_card.partner_id.id
		else:
			self.partner_id = False
		
		return self.env.ref('pos_membership_odoo.action_membership_card_front_img').report_action(self)


class PosMembershipBackImage(models.Model):

	_name = 'pos.membership.back.image'
	_description = "Pos Membership Back Image"

	partner_id  =  fields.Many2one('res.partner')
	membership_template = fields.Many2one('pos.membership.template.settings')
	membership_code = fields.Char('Membership Code')
	hide_barcode = fields.Char('Hidden Barcode')

	
	def print_membership_card_back_img(self):
		curr_card = self.env['pos.membership'].search([('id','=',self._context.get('active_id'))])
		
		if curr_card.membership_template:
			self.membership_template = curr_card.membership_template.id
		else:
			self.membership_template = False

		if curr_card.membership_code:
			self.membership_code = curr_card.membership_code
		else:
			self.membership_code = False

		if curr_card.hide_barcode:
			self.hide_barcode = curr_card.hide_barcode
		else:
			self.hide_barcode = False

		if curr_card.partner_id:
			self.partner_id = curr_card.partner_id.id
		else:
			self.partner_id = False
		
		return self.env.ref('pos_membership_odoo.action_membership_card_back_img').report_action(self)


class PosMembershipFullFrontImage(models.Model):

	_name = 'pos.membership.full.front.image'
	_description = "Pos Membership Full Front Image"


	partner_id  =  fields.Many2one('res.partner')
	membership_template = fields.Many2one('pos.membership.template.settings')
	
	def print_membership_card_full_front_img(self):
		curr_card = self.env['pos.membership'].search([('id','=',self._context.get('active_id'))])
		
		if curr_card.membership_template:
			self.membership_template = curr_card.membership_template.id
		else:
			self.membership_template = False

		if curr_card.partner_id:
			self.partner_id = curr_card.partner_id.id
		else:
			self.partner_id = False
		
		return self.env.ref('pos_membership_odoo.action_membership_card_full_front_img').report_action(self)


class PosMembershipFullBackImage(models.Model):

	_name = 'pos.membership.full.back.image'
	_description = "Pos Membership Back Image"


	partner_id  =  fields.Many2one('res.partner')
	membership_template = fields.Many2one('pos.membership.template.settings')
	membership_code = fields.Char('Membership Code')
	hide_barcode = fields.Char('Hidden Barcode')
	barcode_margin_top  = fields.Char('Maargin Top')
	
	def print_membership_card_full_back_img(self):
		curr_card = self.env['pos.membership'].search([('id','=',self._context.get('active_id'))])
		
		if curr_card.membership_template:
			self.membership_template = curr_card.membership_template.id
			if self.membership_template.label_hight:
				mt =int((self.membership_template.label_hight*55)/66)
				self.barcode_margin_top = mt
		else:
			self.membership_template = False

		if curr_card.membership_code:
			self.membership_code = curr_card.membership_code
		else:
			self.membership_code = False

		if curr_card.hide_barcode:
			self.hide_barcode = curr_card.hide_barcode
		else:
			self.hide_barcode = False

		if curr_card.partner_id:
			self.partner_id = curr_card.partner_id.id
		else:
			self.partner_id = False
		
		return self.env.ref('pos_membership_odoo.action_membership_card_full_back_img').report_action(self)


class pos_membership_template_setting(models.Model):

	_name='pos.membership.template.settings'
	_description = "Pos Membership Template Settings"

	_rec_name = 'card_name'

	card_name = fields.Char("Name")
	if_default_template = fields.Boolean("Default Template")

	card_front_image = fields.Binary("Front Image")
	card_back_image = fields.Binary("Back Image")

	print_qty = fields.Integer("Quantity", default = 1)

	label_hight =  fields.Float("Label Height (px)")
	label_width =  fields.Float("Label Width (%)")
	
	barcode_hight =  fields.Float("Barcode Height (px)")
	barcode_width =  fields.Float("Barcode Width (px)")
	
	@api.model  
	def create(self, vals):
		res = super(pos_membership_template_setting, self).create(vals)
		rec = self.search([('if_default_template','=',True)])

		if len(rec) > 1:
			raise UserError(_('Another template is allready selected as default template.'))
		return res

	def write(self, vals):
		res = super(pos_membership_template_setting, self).write(vals)
		rec = self.search([('if_default_template','=',True)])
		
		if len(rec) > 1:
			raise UserError(_('Another template is allready selected as default template.'))
		return res

	@api.constrains('label_hight','label_width')
	@api.onchange('label_hight','label_width')    
	def _check_something(self):
		for record in self:
			
			if record.label_hight > 200:
				raise ValidationError('Image Size is to Large')

			if (record.label_width > 100):
				raise ValidationError('Image Width is not more than 100%')
	
class PosOrderMembershipCode(models.Model):
	_inherit = "pos.order"

	pos_order_membership_code  =  fields.Many2one('pos.membership', string='Membership Code')

	@api.model
	def _order_fields(self, ui_order):
		res = super(PosOrderMembershipCode, self)._order_fields(ui_order)
		if 'pos_membership_code' in ui_order and ui_order['pos_membership_code'] != False:
			membership = self.env['pos.membership'].search([('membership_code', '=', ui_order['pos_membership_code']), ('is_used', '=', False)], limit=1)
			if membership:
				res['pos_order_membership_code'] = membership.id
				if membership.membership_id.allow_one_customer:
					membership.is_used = True
		return res


class PosGroupBy(models.Model):
	_inherit = "report.pos.order"

	pos_order_membership_code  =  fields.Many2one('pos.membership', string='Membership Code')

	def _select(self):
		return super(PosGroupBy, self)._select() + ',s.pos_order_membership_code AS pos_order_membership_code'

	def _group_by(self):
		return super(PosGroupBy, self)._group_by() + ',s.pos_order_membership_code'

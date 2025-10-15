from odoo import api, fields, models, _
import logging

_logger = logging.getLogger(__name__)

class ProductProduct(models.Model):
    _inherit = "product.product"
    
    report_sale_price = fields.Float(compute='_compute_sale_price', store=True)
    report_name_zh_cn = fields.Char(compute='_compute_name_zh_cn')

    # @api.depends('name', 'product_tmpl_id')
    def _compute_name_zh_cn(self):
        for record in self:
            translation = self.env['ir.translation'].search([
                ('res_id', '=', record.product_tmpl_id.id),
                ('lang', '=', 'zh_CN'),
                ("name", "=like", "product.template,name")
            ], limit=1)
            if translation:
                record.report_name_zh_cn = translation.value
            else:
                record.report_name_zh_cn = False

    @api.depends('lst_price', 'product_tmpl_id.taxes_id')
    def _compute_sale_price(self):
        for record in self:
            if record.lst_price:
                # Calcula el precio de venta con impuestos incluidos
                sale_price = record.lst_price
                if record.product_tmpl_id.taxes_id:
                    tax = record.product_tmpl_id.taxes_id[0]
                    tax_amount = tax.amount
                    if tax_amount > 0:
                        sale_price += (sale_price * (tax_amount / 100))
                record.report_sale_price = sale_price
            else:
                record.report_sale_price = 0.0  # Opcional: manejar el caso en el que no haya precio de lista


class ProductTemplate(models.Model):
    _inherit = "product.template"
    
    report_sale_price = fields.Float(compute='_compute_sale_price', store=True)
    report_name_zh_cn = fields.Char(compute='_compute_name_zh_cn')
    
    # @api.depends('name', 'product_variant_ids')
    def _compute_name_zh_cn(self):
        self.env['ir.rule'].clear_caches()
        for record in self:
            try:
                translation = self.env['ir.translation'].search([
                    ('res_id', '=', record.id),
                    ('lang', '=', 'zh_CN'),
                    ("name", "=like", "product.template,name")
                ], limit=1)
                if translation:
                    record.report_name_zh_cn = translation.value
                else:
                    record.report_name_zh_cn = False
            except Exception as e:
                _logger.error(f"Error en el cálculo de report_name_zh_cn para {record}: {e}")
                record.report_name_zh_cn = False
    
    @api.depends('list_price', 'taxes_id')
    def _compute_sale_price(self):
        for record in self:
            if record.list_price:
                # Calcula el precio de venta con impuestos incluidos
                sale_price = record.list_price
                if record.taxes_id:
                    tax = record.taxes_id[0]
                    tax_amount = tax.amount
                    if tax_amount > 0:
                        sale_price += (sale_price * (tax_amount / 100))
                record.report_sale_price = sale_price
            else:
                record.report_sale_price = 0.0  # Opcional: manejar el caso en el que no haya precio de lista
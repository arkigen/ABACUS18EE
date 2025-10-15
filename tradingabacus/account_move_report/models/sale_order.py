# -*- coding: utf-8 -*-
import logging
import validators
import os
from odoo import models, fields, api, tools
from odoo.exceptions import ValidationError
from lxml import etree

_logger = logging.getLogger(__name__)

class sale_order(models.Model):
    _inherit = "sale.order"

    total_lines_volumen = fields.Float(compute='_get_total_lines_volumen', string="Total Volumen (m³)")
    acquirer_id = fields.Many2one(comodel_name="payment.provider", domain=[('state', '!=', 'disabled')])
    total_lines_weight = fields.Float(compute='_get_total_lines_weight', string="Total Weight (kg)")
    custom_discount = fields.Float(compute='_get_custom_discount', string="Subtotal")
    custom_subtotal = fields.Float(compute='_get_subtotal', string="Subtotal")

    pfi_subtotal = fields.Float('PFI Subtotal', compute='_get_pfi_subtotal')
    pfi_discount = fields.Float('PFI Discount', compute='_get_pfi_discount')
    pfi_total = fields.Float('PFI Total', compute='_get_pfi_total')

    @api.depends('order_line')
    def _get_pfi_subtotal(self):
        pfi_subtotal = 0
        for record in self:
            for line in record.order_line:
                pfi_subtotal += line.pfi_total_undiscounted
            record.pfi_subtotal = pfi_subtotal

    @api.depends('order_line')
    def _get_pfi_discount(self):
        pfi_discount = 0
        for record in self:
            for line in record.order_line:
                pfi_discount += line.pfi_discount
            record.pfi_discount = pfi_discount

    @api.depends('order_line')
    def _get_pfi_total(self):
        pfi_total = 0
        for record in self:
            if record.pfi_subtotal > 0:
                pfi_total = record.pfi_subtotal - record.pfi_discount
            record.pfi_total = pfi_total

    def _get_subtotal(self):
        subtotal = float()
        for record in self:
            for line in record.order_line:
                price_unit = float(line.price_unit) - float(line.get_discount(line))
                price_unit = float(price_unit) + float(line.get_sum_taxes_unit_price(line))
                subtotal = float(subtotal) + float(price_unit) * float(line.product_uom_qty)
        record.custom_subtotal = subtotal

    def _get_custom_discount(self):
        discount = float()
        for record in self:
            for line in record.order_line:
                price_unit = float(line.price_unit) * (float(line.discount) / 100)
                discount = float(discount) + float(price_unit) * float(line.product_uom_qty)
        record.custom_discount = discount

    @api.depends('order_line')
    def _get_total_lines_weight(self):
        total_weight = float()
        for record in self:
            for line in record.order_line:
                if (str(line.product_id.uom_id.category_id.name) == str(_("Unidad"))):
                    if line.product_id.weight:
                        _line_weigth = float(line.product_uom_qty) * float(line.product_id.weight)
                    else:
                        _line_weigth = float(line.product_uom_qty) * float(line.product_id.product_tmpl_id.weight)
                    # _line_weigth = float(line.product_uom_qty) * float(line.product_id.product_tmpl_id.weight)
                    total_weight = float(total_weight) + float(_line_weigth)

        record.total_lines_weight = total_weight

    @api.depends('order_line')
    def _get_total_lines_volumen(self):
        total_volumen = float()
        for record in self:
            for line in record.order_line:
                _logger.warning("line.product_id.uom_id.category_id.name")
                _logger.warning(str(line.product_id.uom_id.category_id.name))
                _logger.warning(str(line.product_id.product_tmpl_id.uom_id.category_id.name))
                if (str(line.product_id.uom_id.category_id.name) == str(_("Volumen"))):
                    _line_volumen = float(line.product_uom_qty) * float(line.product_id.product_tmpl_id.volume)
                    total_volumen = float(total_volumen) + float(_line_volumen)

        record.total_lines_volumen = total_volumen
        
        
class sale_order_line(models.Model):
    _inherit = "sale.order.line"

    _price_unit_taxed = fields.Float(compute='_get_price_unit_taxed', string="Unit Price")
    _price_unit_taxed_undiscounted = fields.Float(compute='_get_price_unit_taxed_undiscounted', string="Unit Price")
    _price_unit_untaxed = fields.Float(compute='_get_price_unit_untaxed', string="Unit Price")
    _discount_monetize = fields.Float(compute='_get_discount_monetize', string="Unit Price")
    custom_line_total = fields.Float(compute='_get_custom_line_total', string="Subtotal")

    pfi_unit = fields.Float('PFI Unit', compute='_get_pfi_unit')
    pfi_total = fields.Float('PFI Total', compute='_get_pfi_total')
    pfi_total_undiscounted = fields.Float('PFI Total', compute='_get_pfi_total')
    pfi_discount = fields.Float('PFI Discount', compute='_get_pfi_discount')

    @api.depends('price_unit', 'tax_id')
    def _get_pfi_unit(self):
        for record in self:
            taxes = 0
            for tax in record.tax_id:
                if not tax.price_include:
                    taxes += (record.price_unit * tax.amount) / 100

            record.pfi_unit = record.price_unit + taxes

    @api.depends('price_unit', 'product_uom_qty')
    def _get_pfi_total(self):
        for record in self:
            total_qty = record.pfi_unit * record.product_uom_qty
            record.pfi_total = (total_qty - ((total_qty * record.discount) / 100))
            record.pfi_total_undiscounted = total_qty

    @api.depends('pfi_total', 'discount')
    def _get_pfi_discount(self):
        for record in self:
            record.pfi_discount = ((record.pfi_total_undiscounted * record.discount) / 100)

    def _get_price_unit_taxed(self):
        for record in self:
            record._price_unit_taxed = float(record.price_unit) + (
                    float(record.price_tax) / float(record.product_uom_qty))

    def _get_price_unit_taxed_undiscounted(self):
        for record in self:
            record._price_unit_taxed_undiscounted = float(record.price_unit) + float(
                self.get_sum_taxes_unit_price_unit(record))

    def _get_price_unit_untaxed(self):
        for record in self:
            record._price_unit_untaxed = float(record.price_unit) - (
                    float(record.price_tax) / float(record.product_uom_qty))

    def _get_discount_monetize(self):
        for record in self:
            if (float(record.discount > 0)):
                record._discount_monetize = float(
                    float(record._price_unit_taxed) * (float(record.discount) / float(100)))
            else:
                record._discount_monetize = 0

    def _get_custom_line_total(self):
        for record in self:
            price_unit = float(record.price_unit) - float(self.get_discount(record))
            price_unit = float(price_unit) + float(self.get_sum_taxes_unit_price(record))
            price_total = float(price_unit) * float(record.product_uom_qty)
            record.custom_line_total = price_total

    def get_sum_taxes_unit_price(self, record):
        total_tax = float()
        for tax in record.tax_id:
            if (tax.amount_type == "fixed"):
                total_tax = float(total_tax) + float(tax.amount)
            if (tax.amount_type == "percent"):
                total_tax = float(total_tax) + ((float(record.price_unit) - float(self.get_discount(record))) * float(
                    float(tax.amount) / float(100)))
        return total_tax

    def get_sum_taxes_unit_price_unit(self, record):
        total_tax = float()
        for tax in record.tax_id:
            if (tax.amount_type == "fixed"):
                total_tax = float(total_tax) + float(tax.amount)
            if (tax.amount_type == "percent"):
                total_tax = float(total_tax) + (float(record.price_unit) * float(float(tax.amount) / float(100)))
        return total_tax

    def get_discount(self, record):
        total_discount = float()
        if (float(record.discount > 0)):
            total_discount = float(total_discount) + float(
                float(record.price_unit) * (float(record.discount) / float(100)))
        else:
            total_discount = total_discount
        return total_discount

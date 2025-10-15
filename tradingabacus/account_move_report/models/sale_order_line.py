# -*- coding: utf-8 -*-
import logging
import validators
import os
from odoo import models, fields, api, tools
from odoo.exceptions import ValidationError
from lxml import etree

_logger = logging.getLogger(__name__)


class SaleOrderLine(models.Model):
    _inherit = "sale.order.line"

    _price_unit_taxed = fields.Float(compute='_get_price_unit_taxed', string="Unit Price")
    _price_unit_taxed_undiscounted = fields.Float(compute='_get_price_unit_taxed_undiscounted', string="Unit Price")
    _price_unit_untaxed = fields.Float(compute='_get_price_unit_untaxed', string="Unit Price")
    _discount_monetize = fields.Float(compute='_get_discount_monetize', string="Unit Price")
    custom_line_total = fields.Float(compute='_get_custom_line_total', string="Subtotal")

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

# -*- coding: utf-8 -*-
# Copyright (C) Softhealer Technologies.

from odoo import fields, models

class ShResUsers(models.Model):
    _inherit = 'res.users'

    sh_barcode  = fields.Char(string='Barcode/QR code')
    sh_password  = fields.Char(string='Password')
    sh_pin  = fields.Integer(string='Pin')
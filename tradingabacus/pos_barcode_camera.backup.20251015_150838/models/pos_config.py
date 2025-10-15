# -*- coding: utf-8 -*-
from odoo import models, fields

class PosConfig(models.Model):
    _inherit = 'pos.config'

    iface_camera = fields.Boolean(string='Permitir cámara', default=False)

# -*- coding: utf-8 -*-
import logging
import validators
import os
from odoo import models, fields, api, tools, _
from odoo.exceptions import ValidationError, UserError
from lxml import etree
import string

_logger = logging.getLogger(__name__)

import base64
import functools
import io
import qrcode
import re
import werkzeug.urls

from odoo import _, api, fields, models
from odoo.addons.base.models.res_users import check_identity
from odoo.exceptions import UserError
from odoo.http import request
from odoo import http

from odoo.addons.auth_totp.models.totp import ALGORITHM, DIGITS, TIMESTEP

compress = functools.partial(re.sub, r'\s', '')

class res_partner(models.Model):
    _inherit = "res.partner"

    verification_code = fields.Char(string='Código Verificación')
    _state_id = fields.Many2one(comodel_name='l10n_co_edi_jorels.departments', string="Departamento", ondelete='RESTRICT')
    
    @api.onchange('vat')
    def _onchange_(self):
        if 'res.partner/onchange' in http.request.httprequest.url:
            if self.vat:
                contact = self.sudo().search([('vat','=',self.vat)], limit=1)
                if(contact):
                    if(contact.id != self.id):
                        if(contact.email):
                            raise UserError("El número de identificación existe con correo: " + str(contact.email))
                        else:
                            raise UserError("El número de identificación existe!")
    
    @api.constrains('vat', 'country_id', 'l10n_latam_identification_type_id')
    def check_vat(self):
        try:
            response = super(res_partner, self)._onchange_country()
        except:
             return True
        return response
    
    @api.constrains("vat")
    def _check_vat_unique(self):
        if self.vat:
            contact = self.sudo().search([('vat','=',self.vat)], limit=1)
            if(contact):
                if(contact.id != self.id):
                    if(contact.email):
                        raise UserError("El número de identificación existe con correo: " + str(contact.email))
                    else:
                        raise UserError("El número de identificación existe!")
    
    @api.constrains("email")
    def _check_email_unique(self):
        if self.email:
            contact = self.sudo().search([('email','=',self.email)], limit=1)
            if(contact):
                if(contact.id != self.id):
                    if(contact.name):
                        raise UserError("El correo electrónico existe con nombre: " + str(contact.name))
                    else:
                        raise UserError("El correo electrónico existe!")
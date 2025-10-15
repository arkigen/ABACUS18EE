# -*- coding: utf-8 -*-
import logging
import validators
import os
from odoo import models, fields, api, tools
from odoo.exceptions import ValidationError, UserError
from lxml import etree
import string

_logger = logging.getLogger(__name__)

class document_types(models.Model):
    _inherit = "l10n_latam.identification.type"

    invoice_code = fields.Char(string='Invoice code')
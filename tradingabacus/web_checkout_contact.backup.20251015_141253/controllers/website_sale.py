# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import logging
_logger = logging.getLogger(__name__)

class website_sale(http.Controller):
    def _get_mandatory_billing_fields( self ):
        fields = super(website_sale, self)._get_mandatory_billing_fields()
        fields += ['municipality_id', 'verification_code', 'l10n_latam_identification_type_id']
        return fields
    
    def _get_mandatory_fields_shipping( self ):
        fields = super(website_sale, self)._get_mandatory_fields_shipping()
        fields += ['municipality_id']
        if 'vat' in fields:
            del fields['vat']
        return fields
# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import logging
_logger = logging.getLogger(__name__)

class res_partner(http.Controller):
    @http.route('/contact/verify_document_number', methods=['POST'], type='json', auth="public")
    def verify_document_number(self, **kw):
        document_number = kw.get('vat')
        partner_id = kw.get('partner_id')
        filter = [('vat','=',str(document_number))]
        try:
            if(int(partner_id) > 0):
                filter.append(['partner_id','!=',int(partner_id)])
        except:            
            pass
        contact_count = http.request.env['res.partner'].sudo().search_count(filter)
        return contact_count
    
    @http.route('/contact/verify_email', methods=['POST'], type='json', auth="public")
    def verify_email(self, **kw):
        email = kw.get('email')
        partner_id = kw.get('partner_id')
        filter = [('email','=',str(email))]
        try:
            if(int(partner_id) > 0):
                filter.append(['partner_id','!=',int(partner_id)])
        except:            
            pass
        
        _logger.warning("verify mail")
        _logger.warning(filter)
        
        
        contact_count = http.request.env['res.partner'].sudo().search_count(filter)
        return contact_count
    
    @http.route('/identification/document_type_id', methods=['POST'], type='json', auth="public")
    def document_type_id(self, **kw):
        invoice_code = kw.get('code')
        filter = [('invoice_code','=',str(invoice_code))]
        _logger.warning('name')
        _logger.warning(filter)
        identification_id = http.request.env['l10n_latam.identification.type'].sudo().search(filter, limit=1)
        _logger.warning('object --- ')
        _logger.warning(identification_id.read())
        return { 'name':identification_id.name, 'id':identification_id.id }
# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import logging
_logger = logging.getLogger(__name__)

class departments(http.Controller):
    
    @http.route('/location/get_partner_id', methods=['POST'], type='json', auth="public")
    def get_partner_id(self, **kw):
        partner_id = kw.get('partner_id')
        filter = [('id','=',int(partner_id))]
        contact = http.request.env['res.partner'].sudo().search_read(filter,['_state_id','municipality_id','l10n_latam_identification_type_id','is_company'])
        response = {'contact': contact}
        if(contact):
            _identy = http.request.env['l10n_latam.identification.type'].sudo().browse(int(contact[0]['l10n_latam_identification_type_id'][0]))
            response['identy_invoice_code'] = _identy.invoice_code
        return response
    
    @http.route('/location/get_departments', methods=['POST'], type='json', auth="public")
    def get_departments(self, **kw):
        _departments = http.request.env['l10n_co_edi_jorels.departments'].sudo().search_read([],['id','name'])
        return _departments

    @http.route('/location/get_departments', methods=['POST'], type='json', auth="public")
    def get_departments(self, **kw):
        _departments = http.request.env['l10n_co_edi_jorels.departments'].sudo().search_read([],['id','name'])
        return _departments

    @http.route('/location/get_districts', methods=['POST'], type='json', auth="public")
    def get_districts(self, **kw):
        department_id = kw.get('department_id')
        filter = [('department_id','=',int(department_id))]
        districts = http.request.env['l10n_co_edi_jorels.municipalities'].sudo().search_read(filter,['id','name','code'])
        return districts
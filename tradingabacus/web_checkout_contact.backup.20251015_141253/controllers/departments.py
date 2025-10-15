# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import logging
_logger = logging.getLogger(__name__)

class departments(http.Controller):
    
    @http.route('/location/get_departments', methods=['POST'], type='json', auth="public")
    def get_departments(self, **kw):
        _departments = http.request.env['l10n_co_edi_jorels.departments'].sudo().search_read([],['id','name'])
        return _departments
    
    @http.route('/location/get_districts', methods=['POST'], type='json', auth="public")
    def get_districts(self, **kw):
        department_id = kw.get('department_id')
        filter = [('department_id','=',int(department_id))]
        _logger.warning('filter')
        _logger.warning(filter)
        districts = http.request.env['l10n_co_edi_jorels.municipalities'].sudo().search_read(filter,['id','name','code'])
        return districts
    
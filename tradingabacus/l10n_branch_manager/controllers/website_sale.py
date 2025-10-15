from odoo import http
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.http import request

class WebsiteSaleInherit(WebsiteSale):
    @http.route()
    def address(self, **kw):
        response = super(WebsiteSaleInherit, self).address(**kw)
        if response.qcontext:
            response.qcontext['website_company'] = request.website.company_id.id
        return response

    def _get_mandatory_fields_billing(self, country_id=None):
        fields = super(WebsiteSaleInherit, self)._get_mandatory_fields_billing(country_id)
        return fields

    def _get_mandatory_fields_shipping(self, country_id=None):
        fields = super(WebsiteSaleInherit, self)._get_mandatory_fields_shipping(country_id)
        fields.append('vat')
        return fields

    def values_postprocess(self, order, mode, values, errors, error_msg):
        new_values, errors, error_msg = super(WebsiteSaleInherit, self).values_postprocess(
            order, mode, values, errors, error_msg)
        
        # Add website company to x_studio_company_id
        if request.website:
            company_id = request.website.company_id.id
            if company_id:
                if 'x_studio_company_id' in new_values:
                    if isinstance(new_values['x_studio_company_id'], (list, tuple)):
                        new_values['x_studio_company_id'] = [(4, company_id)]
                    else:
                        new_values['x_studio_company_id'] = [(4, company_id)]
                else:
                    new_values['x_studio_company_id'] = [(4, company_id)]
        
        return new_values, errors, error_msg 
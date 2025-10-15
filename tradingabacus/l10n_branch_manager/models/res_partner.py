from odoo import models, fields, api

class ResPartner(models.Model):
    _inherit = 'res.partner'

    x_studio_company_id = fields.Many2many(
        'res.company',
        'x_res_company_res_partner_rel',
        'res_partner_id',
        'res_company_id',
        string='Empresa',
        default=lambda self: [(6, 0, [self.env.company.id])]
    )
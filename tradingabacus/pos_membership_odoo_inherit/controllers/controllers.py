# -*- coding: utf-8 -*-
# from odoo import http


# class /home/odoo/src/user/posMembershipOdooInherit(http.Controller):
#     @http.route('//home/odoo/src/user/pos_membership_odoo_inherit//home/odoo/src/user/pos_membership_odoo_inherit', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('//home/odoo/src/user/pos_membership_odoo_inherit//home/odoo/src/user/pos_membership_odoo_inherit/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('/home/odoo/src/user/pos_membership_odoo_inherit.listing', {
#             'root': '//home/odoo/src/user/pos_membership_odoo_inherit//home/odoo/src/user/pos_membership_odoo_inherit',
#             'objects': http.request.env['/home/odoo/src/user/pos_membership_odoo_inherit./home/odoo/src/user/pos_membership_odoo_inherit'].search([]),
#         })

#     @http.route('//home/odoo/src/user/pos_membership_odoo_inherit//home/odoo/src/user/pos_membership_odoo_inherit/objects/<model("/home/odoo/src/user/pos_membership_odoo_inherit./home/odoo/src/user/pos_membership_odoo_inherit"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('/home/odoo/src/user/pos_membership_odoo_inherit.object', {
#             'object': obj
#         })

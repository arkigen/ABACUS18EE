# -*- coding: utf-8 -*-
# from odoo import http


# class ProductReport(http.Controller):
#     @http.route('/product_report/product_report/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/product_report/product_report/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('product_report.listing', {
#             'root': '/product_report/product_report',
#             'objects': http.request.env['product_report.product_report'].search([]),
#         })

#     @http.route('/product_report/product_report/objects/<model("product_report.product_report"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('product_report.object', {
#             'object': obj
#         })

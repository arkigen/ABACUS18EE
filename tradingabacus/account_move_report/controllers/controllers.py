# -*- coding: utf-8 -*-
# from odoo import http


# class AccountMoveReport(http.Controller):
#     @http.route('/account_move_report/account_move_report', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/account_move_report/account_move_report/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('account_move_report.listing', {
#             'root': '/account_move_report/account_move_report',
#             'objects': http.request.env['account_move_report.account_move_report'].search([]),
#         })

#     @http.route('/account_move_report/account_move_report/objects/<model("account_move_report.account_move_report"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('account_move_report.object', {
#             'object': obj
#         })
